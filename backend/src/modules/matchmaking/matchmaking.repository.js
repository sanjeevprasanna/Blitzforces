const pool = require("../../config/db");

async function getUserRating(userId) {
  const { rows } = await pool.query(
    "SELECT cf_rating, cf_tier FROM users WHERE id = $1",
    [userId],
  );
  return rows[0] ?? null;
}

async function getUserPoints(userId) {
  const { rows } = await pool.query(
    "SELECT blitzforce_points FROM users WHERE id = $1",
    [userId],
  );
  return rows[0]?.blitzforce_points ?? 0;
}

async function updateUserPoints(userId, delta) {
  const { rows } = await pool.query(
    `UPDATE users SET blitzforce_points = blitzforce_points + $1
     WHERE id = $2 RETURNING blitzforce_points`,
    [delta, userId],
  );
  return rows[0].blitzforce_points;
}

module.exports = { getUserRating, getUserPoints, updateUserPoints };
