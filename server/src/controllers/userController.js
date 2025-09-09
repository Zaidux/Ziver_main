// A helper function to get a random number within a range
function getRandomPoints(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to update the score based on user activity
// 'user' is the user object from our database
// 'activityType' is a string like 'DAILY_LOGIN', 'MINING_CLICK', etc.
function updateUserScore(user, activityType) {
  let pointsToAdd = 0;

  switch (activityType) {
    case 'DAILY_LOGIN':
      pointsToAdd = getRandomPoints(1, 10);
      break;
    case 'MINING_CLICK':
      pointsToAdd = getRandomPoints(5, 15);
      break;
    case 'TASK_PERFORMED':
      pointsToAdd = getRandomPoints(1, 8);
      break;
    case 'REFERRAL_SUCCESS':
      pointsToAdd = getRandomPoints(10, 20);
      break;
    default:
      pointsToAdd = 0;
  }

  // Add the new points to the user's existing score
  user.socialCapitalScore += pointsToAdd;

  console.log(`User ${user.email} performed ${activityType}, earned ${pointsToAdd} points. New score: ${user.socialCapitalScore}`);

  // Here, we would save the updated user object back to the database
  // await user.save();

  return user;
}

// Example Usage:
// Let's pretend we have a user from our database
const mockUser = {
  email: 'zaiduabubakar777@gmail.com',
  zpBalance: 500,
  socialCapitalScore: 150
};

// Simulate a user clicking the mining button
updateUserScore(mockUser, 'MINING_CLICK');
      
