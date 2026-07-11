const express = require("express");
const controller = require("./user.controller");
const auth = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/profile", auth, controller.getProfile);
router.get("/profile/:handle", auth, controller.getProfileByHandle);
router.get("/search", auth, controller.search);

module.exports = router;
