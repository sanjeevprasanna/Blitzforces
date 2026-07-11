const repo = require("./friends.repository");
const redis = require("../../config/redis");

const ONLINE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function sendFriendRequest(userId, targetId) {
  if (userId === targetId) throw new Error("Cannot add yourself as a friend");
  return repo.sendRequest(userId, targetId);
}

async function acceptFriendRequest(userId, requesterId) {
  await repo.acceptRequest(userId, requesterId);
}

async function declineFriendRequest(userId, requesterId) {
  await repo.declineRequest(userId, requesterId);
}

async function removeFriend(userId, friendId) {
  await repo.removeFriend(userId, friendId);
}

async function getFriendsList(userId) {
  const friends = await repo.getFriendsList(userId);
  return Promise.all(
    friends.map(async (f) => {
      const lastSeen = await redis.get(`user:${f.id}:last_seen`);
      const online = lastSeen
        ? Date.now() - parseInt(lastSeen, 10) < ONLINE_TTL_MS
        : false;
      return { ...f, online };
    })
  );
}

async function getPendingRequests(userId) {
  return repo.getPendingRequests(userId);
}

async function isFriend(userId, friendId) {
  return repo.isFriend(userId, friendId);
}

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriendsList,
  getPendingRequests,
  isFriend,
};
