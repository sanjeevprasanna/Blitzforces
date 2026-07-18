const { processQueue } = require("../modules/matchmaking/matchmaking.service");
const redis = require("../config/redis");

// Run matchmaking worker every 5 seconds
setInterval(async () => {
  try {
    const queueKeys = await redis.sMembers("matchmaking:queues");
    if (queueKeys.length > 0) {
      console.log(`[matchmaking.worker] Processing ${queueKeys.length} queue(s):`, queueKeys);
    }
    await processQueue();
  } catch (err) {
    console.error("[matchmaking.worker] Error:", err.message, err.stack);
  }
}, 5000);

console.log("[matchmaking.worker] Started");
