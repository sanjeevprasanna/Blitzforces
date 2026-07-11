const pool = require("../../config/db");

async function sendRequest(userId, targetId) {
  // Check if we already sent a request or are already friends
  const existing = await pool.query(
    `SELECT status FROM friends WHERE user_id = $1 AND friend_id = $2`,
    [userId, targetId]
  );
  if (existing.rows.length > 0) {
    throw new Error(`Already ${existing.rows[0].status}`);
  }

  // If they already sent us a request → auto-accept both directions
  const reverse = await pool.query(
    `SELECT status FROM friends WHERE user_id = $1 AND friend_id = $2`,
    [targetId, userId]
  );
  if (reverse.rows.length > 0 && reverse.rows[0].status === "pending") {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE friends SET status = 'accepted', accepted_at = NOW()
         WHERE user_id = $1 AND friend_id = $2`,
        [targetId, userId]
      );
      await client.query(
        `INSERT INTO friends (user_id, friend_id, status, accepted_at)
         VALUES ($1, $2, 'accepted', NOW())`,
        [userId, targetId]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
    return "accepted";
  }

  await pool.query(
    `INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, 'pending')`,
    [userId, targetId]
  );
  return "pending";
}

async function acceptRequest(userId, requesterId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE friends SET status = 'accepted', accepted_at = NOW()
       WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
       RETURNING id`,
      [requesterId, userId]
    );
    if (updated.rowCount === 0) throw new Error("No pending request found");
    await client.query(
      `INSERT INTO friends (user_id, friend_id, status, accepted_at)
       VALUES ($1, $2, 'accepted', NOW())
       ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted', accepted_at = NOW()`,
      [userId, requesterId]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function declineRequest(userId, requesterId) {
  await pool.query(
    `DELETE FROM friends WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'`,
    [requesterId, userId]
  );
}

async function removeFriend(userId, friendId) {
  await pool.query(
    `DELETE FROM friends
     WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
    [userId, friendId]
  );
}

async function getFriendsList(userId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.cf_handle, u.cf_rating, u.blitzforce_points
     FROM friends f
     JOIN users u ON u.id = f.friend_id
     WHERE f.user_id = $1 AND f.status = 'accepted'
     ORDER BY u.blitzforce_points DESC`,
    [userId]
  );
  return rows;
}

async function getPendingRequests(userId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.cf_handle, u.cf_rating, u.blitzforce_points,
            f.created_at AS requested_at
     FROM friends f
     JOIN users u ON u.id = f.user_id
     WHERE f.friend_id = $1 AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
}

async function isFriend(userId, friendId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM friends WHERE user_id = $1 AND friend_id = $2 AND status = 'accepted'`,
    [userId, friendId]
  );
  return rows.length > 0;
}

module.exports = {
  sendRequest,
  acceptRequest,
  declineRequest,
  removeFriend,
  getFriendsList,
  getPendingRequests,
  isFriend,
};
