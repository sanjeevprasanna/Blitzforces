const service = require("./friends.service");

async function add(req, res) {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: "targetUserId required" });
    const result = await service.sendFriendRequest(req.userId, parseInt(targetUserId, 10));
    res.json({ status: result }); // "pending" or "accepted"
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function accept(req, res) {
  try {
    const requesterId = parseInt(req.params.requesterId, 10);
    await service.acceptFriendRequest(req.userId, requesterId);
    res.json({ status: "accepted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function decline(req, res) {
  try {
    const requesterId = parseInt(req.params.requesterId, 10);
    await service.declineFriendRequest(req.userId, requesterId);
    res.json({ status: "declined" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function remove(req, res) {
  try {
    const friendId = parseInt(req.params.friendId, 10);
    await service.removeFriend(req.userId, friendId);
    res.json({ status: "removed" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function getList(req, res) {
  try {
    const friends = await service.getFriendsList(req.userId);
    res.json({ friends });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getPending(req, res) {
  try {
    const requests = await service.getPendingRequests(req.userId);
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { add, accept, decline, remove, getList, getPending };
