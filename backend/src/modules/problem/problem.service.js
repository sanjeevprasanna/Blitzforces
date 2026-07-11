const redis = require("../../config/redis");
const { getEligibleProblem } = require("./problem.repository");

// Get union of solved problem IDs for both players from Redis
// Falls back to empty if Redis sets don't exist yet
async function getSolvedUnion(userId1, userId2) {
  const [s1, s2] = await Promise.all([
    redis.sMembers(`user:${userId1}:solved`),
    userId2 ? redis.sMembers(`user:${userId2}:solved`) : Promise.resolve([]),
  ]);
  // Union — problem unsolved by BOTH means excluded if solved by EITHER
  const union = new Set([...s1, ...s2]);
  return Array.from(union).map(Number);
}

async function selectProblem(player1Id, player2Id, avgRating) {
  let minRating = Math.max(avgRating - 100, 600);  // Ensure minimum 600
  let maxRating = avgRating + 100;

  const solvedIds = await getSolvedUnion(player1Id, player2Id);
  let problem = await getEligibleProblem(minRating, maxRating, solvedIds);

  if (!problem) {
    // Widen range if nothing found
    minRating = Math.max(avgRating - 200, 600);
    maxRating = avgRating + 200;
    problem = await getEligibleProblem(minRating, maxRating, solvedIds);
  }

  if (!problem) {
    // Really wide range as last resort
    problem = await getEligibleProblem(600, 2500, solvedIds);
  }

  return problem ?? null;
}

module.exports = { selectProblem };
