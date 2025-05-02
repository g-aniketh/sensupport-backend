const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Models
const User = require("../models/User");
const SeniorProfile = require("../models/SeniorProfile");
const VolunteerProfile = require("../models/VolunteerProfile");
const HealthcareProfile = require("../models/HealthcareProfile");
const CommunityProfile = require("../models/CommunityProfile");
const Event = require("../models/Event");
const Feedback = require("../models/Feedback");

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Sample data
const sampleUsers = [
  // Senior users
  {
    name: "Martha Johnson",
    email: "martha@example.com",
    password: "password123",
    role: "senior",
    avatar: "senior1.jpg",
    location: {
      city: "Boston",
      state: "MA",
      coordinates: {
        lat: 42.3601,
        lng: -71.0589,
      },
    },
  },
  // Volunteer users
  {
    name: "John Smith",
    email: "john@example.com",
    password: "password123",
    role: "volunteer",
    avatar: "volunteer1.jpg",
    location: {
      city: "Boston",
      state: "MA",
      coordinates: {
        lat: 42.3655,
        lng: -71.0585,
      },
    },
  },
  {
    name: "Sarah Wilson",
    email: "sarah@example.com",
    password: "password123",
    role: "volunteer",
    avatar: "volunteer2.jpg",
    location: {
      city: "Cambridge",
      state: "MA",
      coordinates: {
        lat: 42.3736,
        lng: -71.1097,
      },
    },
  },
  {
    name: "Michael Lee",
    email: "michael@example.com",
    password: "password123",
    role: "volunteer",
    avatar: "volunteer3.jpg",
    location: {
      city: "Boston",
      state: "MA",
      coordinates: {
        lat: 42.3505,
        lng: -71.073,
      },
    },
  },
  {
    name: "Jessica Chen",
    email: "jessica@example.com",
    password: "password123",
    role: "volunteer",
    avatar: "volunteer4.jpg",
    location: {
      city: "Somerville",
      state: "MA",
      coordinates: {
        lat: 42.3876,
        lng: -71.0995,
      },
    },
  },
  // Healthcare providers
  {
    name: "Dr. Robert Williams",
    email: "robert@example.com",
    password: "password123",
    role: "healthcare",
    avatar: "healthcare1.jpg",
    location: {
      city: "Boston",
      state: "MA",
      coordinates: {
        lat: 42.336,
        lng: -71.0941,
      },
    },
  },
  {
    name: "Nurse Patricia Davis",
    email: "patricia@example.com",
    password: "password123",
    role: "healthcare",
    avatar: "healthcare2.jpg",
    location: {
      city: "Cambridge",
      state: "MA",
      coordinates: {
        lat: 42.3766,
        lng: -71.116,
      },
    },
  },
  {
    name: "Dr. James Taylor",
    email: "james@example.com",
    password: "password123",
    role: "healthcare",
    avatar: "healthcare3.jpg",
    location: {
      city: "Boston",
      state: "MA",
      coordinates: {
        lat: 42.3479,
        lng: -71.0511,
      },
    },
  },
  // Community partners
  {
    name: "Boston Senior Center",
    email: "bostoncenter@example.com",
    password: "password123",
    role: "community",
    avatar: "community1.jpg",
    location: {
      city: "Boston",
      state: "MA",
      coordinates: {
        lat: 42.3582,
        lng: -71.0637,
      },
    },
  },
  {
    name: "Cambridge Elder Services",
    email: "cambridgeelder@example.com",
    password: "password123",
    role: "community",
    avatar: "community2.jpg",
    location: {
      city: "Cambridge",
      state: "MA",
      coordinates: {
        lat: 42.3654,
        lng: -71.1043,
      },
    },
  },
  {
    name: "Senior Wellness Foundation",
    email: "wellness@example.com",
    password: "password123",
    role: "community",
    avatar: "community3.jpg",
    location: {
      city: "Boston",
      state: "MA",
      coordinates: {
        lat: 42.3429,
        lng: -71.0677,
      },
    },
  },
];

// Import sample data
const importData = async () => {
  try {
    // Connect to database
    const conn = await connectDB();

    // Clear existing data
    await User.deleteMany();
    await SeniorProfile.deleteMany();
    await VolunteerProfile.deleteMany();
    await HealthcareProfile.deleteMany();
    await CommunityProfile.deleteMany();
    await Event.deleteMany();
    await Feedback.deleteMany();

    console.log("Data cleared...");

    // Create users
    const createdUsers = [];
    for (let user of sampleUsers) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);

      const createdUser = await User.create(user);
      createdUsers.push(createdUser);

      // Create corresponding profiles based on role
      if (user.role === "senior") {
        await SeniorProfile.create({
          user: createdUser._id,
          dateOfBirth: new Date("1948-05-15"),
          healthConditions: ["Arthritis", "Hypertension"],
          medications: [
            {
              name: "Lisinopril",
              dosage: "10mg",
              frequency: "Daily",
              reminderTime: ["09:00"],
            },
            {
              name: "Acetaminophen",
              dosage: "500mg",
              frequency: "As needed",
              reminderTime: [],
            },
          ],
          emergencyContact: {
            name: "Susan Johnson",
            relationship: "Daughter",
            phone: "555-123-4567",
            email: "susan@example.com",
          },
          interests: ["Reading", "Gardening", "Classical Music", "Painting"],
          assistanceNeeded: {
            mobility: true,
            meals: false,
            companionship: true,
            healthcare: true,
            transportation: true,
            housekeeping: false,
          },
          preferredLanguages: ["English"],
          preferredTimes: {
            morning: true,
            afternoon: true,
            evening: false,
            weekends: true,
          },
          bio: "Retired librarian who loves books and gardening. I enjoy having visitors and sharing stories.",
        });
      } else if (user.role === "volunteer") {
        await VolunteerProfile.create({
          user: createdUser._id,
          skills: [
            "Cooking",
            "Driving",
            "First Aid",
            "Companionship",
            "Reading",
          ],
          availability: {
            monday: ["14:00", "15:00", "16:00"],
            tuesday: [],
            wednesday: ["14:00", "15:00", "16:00"],
            thursday: [],
            friday: ["14:00", "15:00", "16:00"],
            saturday: ["10:00", "11:00", "12:00", "13:00", "14:00"],
            sunday: ["10:00", "11:00", "12:00", "13:00", "14:00"],
          },
          interests: ["Reading", "Gardening", "Music", "Chess", "Cooking"],
          languages: ["English", "Spanish"],
          verificationStatus: "verified",
          backgroundCheck: {
            completed: true,
            date: new Date(),
          },
          experience:
            "I have been volunteering with seniors for 5 years. I find it very rewarding.",
          servicesOffered: {
            mobility: true,
            meals: true,
            companionship: true,
            healthcare: false,
            transportation: true,
            housekeeping: false,
          },
          bio: "College student who loves spending time with seniors. I can help with transportation, companionship, and meal preparation.",
          transportationMethod: "Car",
          maxDistance: 15,
        });
      } else if (user.role === "healthcare") {
        await HealthcareProfile.create({
          user: createdUser._id,
          specialty: user.name.includes("Nurse")
            ? "Nursing"
            : "General Medicine",
          credentials: [
            "Licensed Physician",
            "Board Certified in Family Medicine",
          ],
          licenseNumber: "MED12345",
          availability: {
            monday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
            tuesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
            wednesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
            thursday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
            friday: ["09:00", "10:00", "11:00"],
            saturday: [],
            sunday: [],
          },
          services: [
            "Routine Checkups",
            "Medication Management",
            "Blood Pressure Monitoring",
            "Telehealth Consultations",
          ],
          acceptedInsurance: [
            "Medicare",
            "Blue Cross",
            "Aetna",
            "UnitedHealthcare",
          ],
          telemedOffered: true,
          languages: ["English"],
          bio: "Experienced physician specializing in geriatric care. I provide both in-home visits and telehealth consultations.",
          yearsOfExperience: 15,
          maxDistance: 20,
        });
      } else if (user.role === "community") {
        await CommunityProfile.create({
          user: createdUser._id,
          organizationType: "Non-profit",
          services: [
            "Meals on Wheels",
            "Social Activities",
            "Transportation",
            "Health Workshops",
            "Support Groups",
          ],
          operatingHours: {
            monday: { open: "09:00", close: "17:00" },
            tuesday: { open: "09:00", close: "17:00" },
            wednesday: { open: "09:00", close: "17:00" },
            thursday: { open: "09:00", close: "17:00" },
            friday: { open: "09:00", close: "17:00" },
            saturday: { open: "10:00", close: "14:00" },
            sunday: { open: "", close: "" },
          },
          contactPerson: {
            name: "Emily Rodriguez",
            position: "Program Director",
            phone: "555-987-6543",
            email: "emily@example.com",
          },
          facilitiesOffered: [
            "Community Hall",
            "Computer Lab",
            "Game Room",
            "Garden",
            "Kitchen",
          ],
          description:
            "We provide a variety of services to seniors in the Boston area, including meals, transportation, and social activities.",
          website: "www.bostonseniorcenter.org",
          socialMedia: {
            facebook: "facebook.com/bostonseniorcenter",
            twitter: "twitter.com/bostonseniors",
            instagram: "instagram.com/bostonseniorcenter",
          },
        });
      }
    }

    // Create sample events
    const events = [
      {
        title: "Chair Yoga Class",
        description:
          "A gentle yoga class designed for seniors to improve flexibility and balance.",
        date: new Date("2025-06-01T10:00:00.000Z"),
        startTime: "10:00",
        endTime: "11:00",
        location: {
          address: "123 Main St",
          city: "Boston",
          state: "MA",
          zip: "02108",
          coordinates: {
            lat: 42.3582,
            lng: -71.0637,
          },
          virtual: false,
        },
        organizer: createdUsers[8]._id, // Boston Senior Center
        category: "health",
        maxCapacity: 20,
        tags: ["yoga", "exercise", "wellness", "beginner-friendly"],
        costInfo: {
          isFree: true,
        },
        accessibility: {
          wheelchairAccessible: true,
          hearingAssistance: true,
          visualAssistance: false,
        },
      },
      {
        title: 'Book Club Meeting: "The Dutch House"',
        description:
          'Join us to discuss Ann Patchett\'s novel "The Dutch House".',
        date: new Date("2025-06-05T14:00:00.000Z"),
        startTime: "14:00",
        endTime: "15:30",
        location: {
          address: "456 Oak St",
          city: "Cambridge",
          state: "MA",
          zip: "02139",
          coordinates: {
            lat: 42.3654,
            lng: -71.1043,
          },
          virtual: false,
        },
        organizer: createdUsers[9]._id, // Cambridge Elder Services
        category: "social",
        maxCapacity: 15,
        tags: ["reading", "books", "discussion", "literature"],
        costInfo: {
          isFree: true,
        },
        accessibility: {
          wheelchairAccessible: true,
          hearingAssistance: false,
          visualAssistance: false,
        },
      },
      {
        title: "Medication Management Workshop",
        description:
          "Learn strategies for managing multiple medications safely and effectively.",
        date: new Date("2025-06-10T13:00:00.000Z"),
        startTime: "13:00",
        endTime: "14:30",
        location: {
          address: "789 Pine St",
          city: "Boston",
          state: "MA",
          zip: "02116",
          coordinates: {
            lat: 42.3429,
            lng: -71.0677,
          },
          virtual: false,
        },
        organizer: createdUsers[10]._id, // Senior Wellness Foundation
        category: "educational",
        maxCapacity: 30,
        tags: ["health", "medication", "education", "wellness"],
        costInfo: {
          isFree: true,
        },
        accessibility: {
          wheelchairAccessible: true,
          hearingAssistance: true,
          visualAssistance: true,
        },
      },
      {
        title: "Virtual Cooking Class: Mediterranean Diet",
        description:
          "Join Chef Maria for a virtual cooking class focusing on easy Mediterranean recipes.",
        date: new Date("2025-06-15T16:00:00.000Z"),
        startTime: "16:00",
        endTime: "17:30",
        location: {
          virtual: true,
          meetingLink: "https://zoom.us/j/examplelink",
        },
        organizer: createdUsers[9]._id, // Cambridge Elder Services
        category: "recreational",
        maxCapacity: 0, // unlimited
        tags: ["cooking", "nutrition", "mediterranean", "virtual"],
        costInfo: {
          isFree: true,
        },
        accessibility: {
          wheelchairAccessible: true,
          hearingAssistance: true,
          visualAssistance: true,
        },
      },
    ];

    await Event.insertMany(events);

    // Create sample feedback
    const feedback = [
      {
        user: createdUsers[0]._id, // Martha (senior)
        content:
          "The app is very helpful, but I find the font too small in some sections.",
        rating: 4,
        category: "usability",
        status: "pending",
        isAnonymous: false,
      },
      {
        user: createdUsers[1]._id, // John (volunteer)
        content:
          "The matching system works well, but it would be nice to have more filtering options.",
        rating: 4,
        category: "matching",
        status: "pending",
        isAnonymous: false,
      },
      {
        user: createdUsers[5]._id, // Dr. Robert (healthcare)
        content:
          "I would like to have a calendar integration for scheduling appointments.",
        rating: 3,
        category: "feature",
        status: "pending",
        isAnonymous: false,
      },
    ];

    await Feedback.insertMany(feedback);

    console.log("Sample data imported!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the import
importData();
