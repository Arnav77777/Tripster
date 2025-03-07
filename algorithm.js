const users = [
    {
        id: 1,
        name: "Alice",
        destination: "Paris",
        startLocation: "New York",
        minBudget: 500,
        maxBudget: 1000,
        startDate: "2024-12-10",
        endDate: "2024-12-20",
        activities: ["sightseeing", "food", "hiking"],
        tourists: 1
    },
    {
        id: 2,
        name: "Bob",
        destination: "Paris",
        startLocation: "London",
        minBudget: 700,
        maxBudget: 1200,
        startDate: "2024-12-15",
        endDate: "2024-12-25",
        activities: ["food", "shopping", "museums"],
        tourists: 2
    },
];

const targetUser = {
    id: 3,
    name: "Charlie",
    destination: "Paris",
    startLocation: "New York",
    minBudget: 600,
    maxBudget: 1100,
    startDate: "2024-12-12",
    endDate: "2024-12-22",
    activities: ["hiking", "food", "museums"],
    tourists: 1
};

function datesOverlap(userStart, userEnd, targetStart, targetEnd) {
    return new Date(userEnd) >= new Date(targetStart) && new Date(userStart) <= new Date(targetEnd);
}

function activityMatchScore(userActivities, targetActivities) {
    const commonActivities = userActivities.filter(activity => targetActivities.includes(activity));
    return (commonActivities.length / targetActivities.length) * 100;
}

function findMatches(users, targetUser) {
    const matches = [];

    users.forEach(user => {
        if (user.destination !== targetUser.destination) return; // Destination filter
        if (!datesOverlap(user.startDate, user.endDate, targetUser.startDate, targetUser.endDate)) return; // Date overlap filter
        if (user.minBudget > targetUser.maxBudget || user.maxBudget < targetUser.minBudget) return; // Budget range filter
        if (user.startLocation !== targetUser.startLocation) return; // Starting location filter

        let score = 0;
        const weights = { budget: 0.2, dates: 0.2, activities: 0.3, tourists: 0.3 };

        const budgetMatchScore = (Math.min(user.maxBudget, targetUser.maxBudget) - Math.max(user.minBudget, targetUser.minBudget)) / (targetUser.maxBudget - targetUser.minBudget) * 100;
        score += budgetMatchScore * weights.budget;

        const dateScore = datesOverlap(user.startDate, user.endDate, targetUser.startDate, targetUser.endDate) ? 100 : 50;
        score += dateScore * weights.dates;

        const activityScore = activityMatchScore(user.activities, targetUser.activities);
        score += activityScore * weights.activities;

        const touristScore = (1 - Math.abs(user.tourists - targetUser.tourists) / Math.max(user.tourists, targetUser.tourists)) * 100;
        score += touristScore * weights.tourists;

        matches.push({ user, score });
    });

    matches.sort((a, b) => b.score - a.score);

    return matches;
}

const matchedProfiles = findMatches(users, targetUser);
console.log("Matched Profiles:", matchedProfiles);
