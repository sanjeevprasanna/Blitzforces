const express = require("express");
const controller = require("./friends.controller");
const auth = require("../../middleware/auth.middleware");

const router = express.Router();
router.use(auth);

router.post("/add", controller.add);
router.post("/accept/:requesterId", controller.accept);
router.delete("/decline/:requesterId", controller.decline);
router.delete("/:friendId", controller.remove);
router.get("/list", controller.getList);
router.get("/pending", controller.getPending);

module.exports = router;
