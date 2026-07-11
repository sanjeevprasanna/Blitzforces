const userService = require("./user.service");

async function getProfile(req, res) {
  try {
    const profile = await userService.getProfile(req.userId);
    res.json(profile);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
}

async function getProfileByHandle(req, res) {
  try {
    const profile = await userService.getProfileByHandle(req.params.handle);
    res.json(profile);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
}

async function search(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }
    const users = await userService.searchUsers(q, req.userId);
    res.json({ users });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { getProfile, getProfileByHandle, search };
