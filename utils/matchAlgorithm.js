const User = require("../models/User");
const SeniorProfile = require("../models/SeniorProfile");
const VolunteerProfile = require("../models/VolunteerProfile");
const HealthcareProfile = require("../models/HealthcareProfile");
const CommunityProfile = require("../models/CommunityProfile");

// Calculate distance between two points using Haversine formula
const calculateDistance = (coords1, coords2) => {
  if (!coords1 || !coords2 || !coords1.lat || !coords2.lat) return Infinity;

  const toRad = value => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

// Calculate matching score based on shared interests
const calculateInterestScore = (seniorInterests, providerInterests) => {
  if (!seniorInterests || !providerInterests) return 0;
  if (seniorInterests.length === 0 || providerInterests.length === 0) return 0;

  const matchingInterests = seniorInterests.filter(interest =>
    providerInterests.includes(interest)
  );
  return (matchingInterests.length / seniorInterests.length) * 30; // Worth 30% of total score
};

// Calculate matching score based on language compatibility
const calculateLanguageScore = (seniorLanguages, providerLanguages) => {
  if (!seniorLanguages || !providerLanguages) return 0;
  if (seniorLanguages.length === 0 || providerLanguages.length === 0) return 0;

  const matchingLanguages = seniorLanguages.filter(language =>
    providerLanguages.includes(language)
  );
  return matchingLanguages.length > 0 ? 20 : 0; // Worth 20% of total score
};

// Calculate matching score based on service needs and offerings
const calculateServiceScore = (seniorNeeds, providerServices) => {
  if (!seniorNeeds || !providerServices) return 0;

  let matchCount = 0;
  let needCount = 0;

  for (const [need, needed] of Object.entries(seniorNeeds)) {
    if (needed) {
      needCount++;
      if (providerServices[need]) {
        matchCount++;
      }
    }
  }

  return needCount > 0 ? (matchCount / needCount) * 40 : 0; // Worth 40% of total score
};

// Calculate availability compatibility
const calculateAvailabilityScore = (
  seniorPreferredTimes,
  providerAvailability
) => {
  if (!seniorPreferredTimes || !providerAvailability) return 10; // Default value

  // Simplified availability matching
  let score = 0;

  if (seniorPreferredTimes.morning) {
    // Check if provider has any morning availability
    const hasMorning = Object.values(providerAvailability).some(times =>
      times.some(time => {
        const hour = parseInt(time.split(":")[0]);
        return hour >= 6 && hour < 12;
      })
    );
    if (hasMorning) score += 2.5;
  }

  if (seniorPreferredTimes.afternoon) {
    // Check if provider has any afternoon availability
    const hasAfternoon = Object.values(providerAvailability).some(times =>
      times.some(time => {
        const hour = parseInt(time.split(":")[0]);
        return hour >= 12 && hour < 17;
      })
    );
    if (hasAfternoon) score += 2.5;
  }

  if (seniorPreferredTimes.evening) {
    // Check if provider has any evening availability
    const hasEvening = Object.values(providerAvailability).some(times =>
      times.some(time => {
        const hour = parseInt(time.split(":")[0]);
        return hour >= 17 && hour < 22;
      })
    );
    if (hasEvening) score += 2.5;
  }

  if (seniorPreferredTimes.weekends) {
    // Check if provider has weekend availability
    const hasWeekends =
      providerAvailability.saturday?.length > 0 ||
      providerAvailability.sunday?.length > 0;
    if (hasWeekends) score += 2.5;
  }

  return score; // Worth 10% of total score
};

// Get match recommendations for a senior
exports.getRecommendationsForSenior = async (seniorId, seniorProfile) => {
  try {
    // Get the senior user
    const senior = await User.findById(seniorId);
    if (!senior || senior.role !== "senior") {
      throw new Error("Invalid senior user");
    }

    // If seniorProfile wasn't provided, fetch it
    if (!seniorProfile) {
      seniorProfile = await SeniorProfile.findOne({ user: seniorId });
      if (!seniorProfile) {
        throw new Error("Senior profile not found");
      }
    }

    // Get all providers (volunteers, healthcare, community)
    const providers = await User.find({
      role: { $in: ["volunteer", "healthcare", "community"] },
    });

    // Array to store match recommendations with scores
    const recommendations = [];

    // Process each provider
    for (const provider of providers) {
      let profileModel;
      switch (provider.role) {
        case "volunteer":
          profileModel = VolunteerProfile;
          break;
        case "healthcare":
          profileModel = HealthcareProfile;
          break;
        case "community":
          profileModel = CommunityProfile;
          break;
      }

      const providerProfile = await profileModel.findOne({
        user: provider._id,
      });

      if (!providerProfile) continue;

      // Calculate distance score - Worth 20% of total score
      let distanceScore = 0;
      const distance = calculateDistance(
        senior.location?.coordinates,
        provider.location?.coordinates
      );

      if (distance !== Infinity) {
        // Close distance (under 5km) gets full score
        if (distance < 5) {
          distanceScore = 20;
        }
        // Between 5-20km gets partial score
        else if (distance < 20) {
          distanceScore = 20 - ((distance - 5) / 15) * 15; // Scales from 20 down to 5
        }
        // Beyond 20km gets minimal score
        else {
          distanceScore = Math.max(0, 5 - (distance - 20) / 30); // Gradually approaches 0
        }
      }

      // Calculate other scores based on provider type
      let interestScore = 0;
      let languageScore = 0;
      let serviceScore = 0;
      let availabilityScore = 0;

      if (provider.role === "volunteer") {
        interestScore = calculateInterestScore(
          seniorProfile.interests,
          providerProfile.interests
        );

        languageScore = calculateLanguageScore(
          seniorProfile.preferredLanguages,
          providerProfile.languages
        );

        serviceScore = calculateServiceScore(
          seniorProfile.assistanceNeeded,
          providerProfile.servicesOffered
        );

        availabilityScore = calculateAvailabilityScore(
          seniorProfile.preferredTimes,
          providerProfile.availability
        );
      } else if (provider.role === "healthcare") {
        // For healthcare providers, focus more on services and specialties
        languageScore = calculateLanguageScore(
          seniorProfile.preferredLanguages,
          providerProfile.languages
        );

        // Adapt healthcare specialties to senior needs
        const healthcareNeeds = {
          healthcare: seniorProfile.assistanceNeeded.healthcare,
        };
        if (
          seniorProfile.healthConditions &&
          seniorProfile.healthConditions.length
        ) {
          // Check if the provider specializes in any of the senior's conditions
          const specializationMatch = seniorProfile.healthConditions.some(
            condition =>
              providerProfile.specialty
                .toLowerCase()
                .includes(condition.toLowerCase()) ||
              providerProfile.services.some(service =>
                service.toLowerCase().includes(condition.toLowerCase())
              )
          );

          serviceScore = specializationMatch ? 40 : 20;
        } else {
          serviceScore = 20; // Default score if no specific conditions
        }

        availabilityScore = calculateAvailabilityScore(
          seniorProfile.preferredTimes,
          providerProfile.availability
        );
      } else if (provider.role === "community") {
        // For community partners, focus on service offerings and location
        const communityServices = {};
        if (providerProfile.services && providerProfile.services.length) {
          providerProfile.services.forEach(service => {
            communityServices[service.toLowerCase()] = true;
          });
        }

        // Map community services to senior needs
        const communityServiceMatch = {
          mobility:
            communityServices["transportation"] ||
            communityServices["accessibility"],
          meals: communityServices["meals"] || communityServices["food"],
          companionship:
            communityServices["social"] ||
            communityServices["community events"],
          healthcare:
            communityServices["health services"] ||
            communityServices["wellness"],
          transportation: communityServices["transportation"],
          housekeeping: communityServices["home assistance"],
        };

        serviceScore = calculateServiceScore(
          seniorProfile.assistanceNeeded,
          communityServiceMatch
        );

        // Community partners get higher distance score since they typically serve larger areas
        distanceScore *= 1.5;
        if (distanceScore > 20) distanceScore = 20;

        // Interest matching for community partners based on services and facilities
        if (seniorProfile.interests && seniorProfile.interests.length) {
          interestScore = seniorProfile.interests.some(
            interest =>
              providerProfile.facilitiesOffered &&
              providerProfile.facilitiesOffered.some(facility =>
                facility.toLowerCase().includes(interest.toLowerCase())
              )
          )
            ? 20
            : 10;
        }
      }

      // Calculate total match score
      const totalScore =
        distanceScore +
        interestScore +
        languageScore +
        serviceScore +
        availabilityScore;

      // Create recommendation object
      recommendations.push({
        provider: {
          _id: provider._id,
          name: provider.name,
          role: provider.role,
          avatar: provider.avatar,
          location: provider.location,
        },
        matchScore: Math.round(totalScore),
        distance: distance !== Infinity ? Math.round(distance * 10) / 10 : null,
        matchDetails: {
          distanceScore: Math.round(distanceScore),
          interestScore: Math.round(interestScore),
          languageScore: Math.round(languageScore),
          serviceScore: Math.round(serviceScore),
          availabilityScore: Math.round(availabilityScore),
        },
      });
    }

    // Sort recommendations by match score (highest first)
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return recommendations;
  } catch (error) {
    console.error("Error in match algorithm:", error);
    throw error;
  }
};
