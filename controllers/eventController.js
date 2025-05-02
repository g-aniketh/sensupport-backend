const Event = require("../models/Event");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc    Create new event
// @route   POST /api/events
// @access  Private
exports.createEvent = async (req, res, next) => {
  try {
    req.body.organizer = req.user.id;

    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all events with filtering
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res, next) => {
  try {
    // Build query
    let query = {};

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by date range
    if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate) };
    }

    if (req.query.endDate) {
      if (!query.date) query.date = {};
      query.date.$lte = new Date(req.query.endDate);
    }

    // Filter by organizer
    if (req.query.organizer) {
      query.organizer = req.query.organizer;
    }

    // Filter by location if city is provided
    if (req.query.city) {
      query["location.city"] = { $regex: req.query.city, $options: "i" };
    }

    // Get events matching query
    const events = await Event.find(query)
      .populate("organizer", "name avatar role")
      .populate("participants.user", "name avatar")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name avatar role")
      .populate("participants.user", "name avatar");

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (organizer only)
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    // Make sure user is the event organizer
    if (
      event.organizer.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this event",
      });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Notify participants about the update
    const participants = event.participants.map(p => p.user);

    if (participants.length > 0) {
      const notifications = participants.map(userId => ({
        recipient: userId,
        sender: req.user.id,
        title: "Event Updated",
        message: `The event "${event.title}" has been updated.`,
        type: "event",
        relatedTo: {
          model: "Event",
          id: event._id,
        },
        action: {
          text: "View Event",
          url: `/events/${event._id}`,
        },
      }));

      await Notification.insertMany(notifications);
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (organizer only)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    // Make sure user is the event organizer
    if (
      event.organizer.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this event",
      });
    }

    await event.deleteOne();

    // Notify participants about the cancellation
    const participants = event.participants.map(p => p.user);

    if (participants.length > 0) {
      const notifications = participants.map(userId => ({
        recipient: userId,
        sender: req.user.id,
        title: "Event Cancelled",
        message: `The event "${event.title}" has been cancelled.`,
        type: "event",
        importance: "high",
      }));

      await Notification.insertMany(notifications);
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    // Check if event is at capacity
    if (
      event.maxCapacity > 0 &&
      event.participants.length >= event.maxCapacity
    ) {
      return res.status(400).json({
        success: false,
        error: "Event has reached maximum capacity",
      });
    }

    // Check if user is already registered
    const alreadyRegistered = event.participants.some(
      participant => participant.user.toString() === req.user.id
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        error: "Already registered for this event",
      });
    }

    // Add user to participants
    event.participants.push({
      user: req.user.id,
      status: "registered",
    });

    await event.save();

    // Notify event organizer
    await Notification.create({
      recipient: event.organizer,
      sender: req.user.id,
      title: "New Event Registration",
      message: `${req.user.name} has registered for your event "${event.title}"`,
      type: "event",
      relatedTo: {
        model: "Event",
        id: event._id,
      },
      action: {
        text: "View Event",
        url: `/events/${event._id}`,
      },
    });

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel registration for an event
// @route   DELETE /api/events/:id/register
// @access  Private
exports.cancelEventRegistration = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    // Check if user is registered
    const registrationIndex = event.participants.findIndex(
      participant => participant.user.toString() === req.user.id
    );

    if (registrationIndex === -1) {
      return res.status(400).json({
        success: false,
        error: "Not registered for this event",
      });
    }

    // Remove user from participants
    event.participants.splice(registrationIndex, 1);

    await event.save();

    // Notify event organizer
    await Notification.create({
      recipient: event.organizer,
      sender: req.user.id,
      title: "Event Registration Cancelled",
      message: `${req.user.name} has cancelled their registration for your event "${event.title}"`,
      type: "event",
      relatedTo: {
        model: "Event",
        id: event._id,
      },
      action: {
        text: "View Event",
        url: `/events/${event._id}`,
      },
    });

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get events organized by current user
// @route   GET /api/events/organized
// @access  Private
exports.getOrganizedEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .populate("organizer", "name avatar role")
      .populate("participants.user", "name avatar")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get events where current user is registered
// @route   GET /api/events/registered
// @access  Private
exports.getRegisteredEvents = async (req, res, next) => {
  try {
    const events = await Event.find({
      "participants.user": req.user.id,
    })
      .populate("organizer", "name avatar role")
      .populate("participants.user", "name avatar")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    next(err);
  }
};
