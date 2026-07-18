const redis = require("../../config/redis");
const { getUserRating, getUserPoints, updateUserPoints } = require("./matchmaking.repository");
const { createDuel } = require("../duel/duel.service");

// Registry tracks which queue keys are active
const QUEUE_REGISTRY = "matchmaking:queues";
const WAIT_TIMES   = [0, 30, 60];
const RATING_BANDS = [200, 300, 400];
const BOT_WAIT_SECS = 90;

const VALID_BET_AMOUNTS = [50, 100, 200, 500, 1000];

function getQueueKey() {
  // All players in single queue, matched by mode compatibility
  return "matchmaking:queue:normal";
}

function normalizeBetAmount(mode, betAmount) {
  if (mode !== "bet") return 0;
  const parsed = Number(betAmount);
  return Number.isInteger(parsed) ? parsed : NaN;
}

function isCompatibleMatch(meta1, meta2) {
  const mode1 = meta1.mode ?? "normal";
  const mode2 = meta2.mode ?? "normal";
  if (mode1 !== mode2) return false;
  if (mode1 !== "bet") return true;
  return parseInt(meta1.betAmount ?? "0", 10) === parseInt(meta2.betAmount ?? "0", 10);
}

function getDurationOptions(lowerTier) {
  const expertAndAbove = [
    "expert", "candidate master", "master",
    "international master", "grandmaster", "legendary grandmaster",
  ];
  return expertAndAbove.includes(lowerTier) ? [30, 60] : [20, 40];
}

function getRatingBand(joinedAt) {
  const waited = (Date.now() - joinedAt) / 1000;
  if (waited >= WAIT_TIMES[2]) return RATING_BANDS[2];
  if (waited >= WAIT_TIMES[1]) return RATING_BANDS[1];
  return RATING_BANDS[0];
}

async function joinQueue(userId, mode = "normal", betAmount = 0) {
  // Prevent duplicate queue entry
  const existing = await redis.hGet(`matchmaking:user:${userId}`, "joinedAt");
  if (existing) return { status: "already_queued" };

  // Prevent joining if already in active duel
  const activeDuel = await redis.get(`user:${userId}:active_duel`);
  if (activeDuel) return { status: "active_duel", duelId: activeDuel };

  // Validate mode
  if (mode !== "normal" && mode !== "bet") throw new Error("Invalid mode");
  betAmount = normalizeBetAmount(mode, betAmount);

  // Validate + escrow bet
  if (mode === "bet") {
    if (!Number.isInteger(betAmount) || !VALID_BET_AMOUNTS.includes(betAmount)) {
      throw new Error(`Invalid bet amount. Choose from: ${VALID_BET_AMOUNTS.join(", ")}`);
    }
    const points = await getUserPoints(userId);
    if (points < betAmount) {
      throw new Error(`Not enough points. You have ${points}, need ${betAmount}`);
    }
    // Deduct bet as escrow — refunded if no match found (leaveQueue)
    await updateUserPoints(userId, -betAmount);
  }

  let userInfo;
  try {
    userInfo = await getUserRating(userId);
    if (!userInfo) throw new Error("User not found");
  } catch (err) {
    if (mode === "bet") await updateUserPoints(userId, betAmount);
    throw err;
  }

  const { cf_rating: rating, cf_tier: tier } = userInfo;
  const joinedAt = Date.now();
  const qKey = getQueueKey();

  console.log(`[matchmaking.joinQueue] User ${userId} joined ${qKey} (${mode} mode, rating: ${rating}, tier: ${tier})`);

  await redis.zAdd(qKey, { score: rating, value: String(userId) });
  await redis.sAdd(QUEUE_REGISTRY, qKey);

  await redis.hSet(`matchmaking:user:${userId}`, {
    joinedAt: String(joinedAt),
    rating: String(rating),
    tier,
    mode,
    betAmount: String(betAmount),
    qKey,
  });

  return { status: "queued", joinedAt };
}

async function leaveQueue(userId) {
  const meta = await redis.hGetAll(`matchmaking:user:${userId}`);
  if (!meta?.joinedAt) return;

  const qKey = getQueueKey();
  await redis.zRem(qKey, String(userId));
  await redis.del(`matchmaking:user:${userId}`);

  // Refund escrow if bet mode
  if (meta.mode === "bet" && meta.betAmount) {
    const bet = parseInt(meta.betAmount, 10);
    if (bet > 0) await updateUserPoints(userId, bet);
  }

  // Clean registry if queue is now empty
  const size = await redis.zCard(qKey);
  if (size === 0) await redis.sRem(QUEUE_REGISTRY, qKey);
}

// Called by matchmaking worker every 5s
async function processQueue() {
  const queueKeys = await redis.sMembers(QUEUE_REGISTRY);
  if (!queueKeys.length) return;

  for (const qKey of queueKeys) {
    await processOneQueue(qKey);
  }
}

async function processOneQueue(qKey) {
  try {
    const members = await redis.zRangeWithScores(qKey, 0, -1);
    if (!members.length) {
      await redis.sRem(QUEUE_REGISTRY, qKey);
      return;
    }

    console.log(`[matchmaking.processOneQueue] ${qKey}: ${members.length} player(s)`);

    const processed = new Set();

    for (const { value: userIdStr, score: rating } of members) {
      const userId = parseInt(userIdStr, 10);
      if (processed.has(userId)) continue;

      const meta = await redis.hGetAll(`matchmaking:user:${userId}`);
      if (!meta?.joinedAt) continue;

      const joinedAt = parseInt(meta.joinedAt, 10);
      const waited = (Date.now() - joinedAt) / 1000;
      const mode = meta.mode ?? "normal";

      // Bot fallback after 90s wait
      if (waited >= BOT_WAIT_SECS) {
        console.log(`[matchmaking.processOneQueue] Matching user ${userId} with bot (waited ${waited}s)`);
        try {
          await matchWithBot(userId, parseInt(meta.rating, 10), meta.tier, mode, parseInt(meta.betAmount ?? "0", 10));
          processed.add(userId);
        } catch (err) {
          console.error(`[matchmaking.processOneQueue] Bot match failed for user ${userId}:`, err.message);
        }
        continue;
      }

      // Find rating-compatible opponent in same queue (any mode)
      const band = getRatingBand(joinedAt);
      const candidates = await redis.zRangeByScore(qKey, rating - band, rating + band);
      let opponentId = null;
      let opMeta = null;
      for (const candidateId of candidates.map(Number)) {
        if (candidateId === userId || processed.has(candidateId)) continue;
        const candidateMeta = await redis.hGetAll(`matchmaking:user:${candidateId}`);
        if (!candidateMeta?.joinedAt || !isCompatibleMatch(meta, candidateMeta)) continue;
        opponentId = candidateId;
        opMeta = candidateMeta;
        break;
      }

      if (!opponentId || !opMeta) continue;

      console.log(`[matchmaking.processOneQueue] Matched users ${userId} (${mode}) and ${opponentId} (${opMeta.mode ?? "normal"})`);
      try {
        await matchPlayers(userId, opponentId, parseInt(meta.rating, 10), meta, opMeta, qKey);
        processed.add(userId);
        processed.add(opponentId);
      } catch (err) {
        console.error(`[matchmaking.processOneQueue] Match failed for users ${userId} and ${opponentId}:`, err.message);
      }
    }
  } catch (err) {
    console.error(`[matchmaking.processOneQueue] Queue processing error for ${qKey}:`, err.message);
  }
}

async function matchPlayers(userId1, userId2, rating1, meta1, meta2, qKey) {
  const rating2 = parseInt(meta2.rating, 10);
  const avgRating = Math.round((rating1 + rating2) / 2);
  const mode = meta1.mode ?? "normal";
  const betAmount = parseInt(meta1.betAmount ?? "0", 10);

  const lowerTier = rating1 <= rating2 ? meta1.tier : meta2.tier;
  const durationOpts = getDurationOptions(lowerTier);
  const duration = durationOpts[0];

  const duel = await createDuel({
    player1Id: userId1,
    player2Id: userId2,
    avgRating,
    duration,
    mode,
    betAmount,
    isBot: false,
  });

  await Promise.all([
    redis.hSet(`matchmaking:user:${userId1}`, "duelId", String(duel.id)),
    redis.hSet(`matchmaking:user:${userId2}`, "duelId", String(duel.id)),
    redis.set(`user:${userId1}:active_duel`, String(duel.id)),
    redis.set(`user:${userId2}:active_duel`, String(duel.id)),
    redis.zRem(qKey, String(userId1)),
    redis.zRem(qKey, String(userId2)),
  ]);

  const size = await redis.zCard(qKey);
  if (size === 0) await redis.sRem(QUEUE_REGISTRY, qKey);

  return duel;
}

async function matchWithBot(userId, rating, tier, mode = "normal", betAmount = 0) {
  const durationOpts = getDurationOptions(tier);
  const duration = durationOpts[0];
  const qKey = getQueueKey();

  const duel = await createDuel({
    player1Id: userId,
    player2Id: null,
    avgRating: rating,
    duration,
    mode,
    betAmount,
    isBot: true,
  });

  await Promise.all([
    redis.hSet(`matchmaking:user:${userId}`, "duelId", String(duel.id)),
    redis.set(`user:${userId}:active_duel`, String(duel.id)),
    redis.zRem(qKey, String(userId)),
  ]);

  const size = await redis.zCard(qKey);
  if (size === 0) await redis.sRem(QUEUE_REGISTRY, qKey);

  return duel;
}

async function getQueueStatus(userId) {
  const activeDuel = await redis.get(`user:${userId}:active_duel`);
  if (activeDuel) return { status: "matched", duelId: parseInt(activeDuel, 10) };

  const meta = await redis.hGetAll(`matchmaking:user:${userId}`);
  if (!meta?.joinedAt) return { status: "not_queued" };

  if (meta.duelId) return { status: "matched", duelId: parseInt(meta.duelId, 10) };

  const waited = Math.floor((Date.now() - parseInt(meta.joinedAt, 10)) / 1000);
  return {
    status: "queued",
    waited,
    band: getRatingBand(parseInt(meta.joinedAt, 10)),
    mode: meta.mode ?? "normal",
    betAmount: parseInt(meta.betAmount ?? "0", 10),
  };
}

module.exports = { joinQueue, leaveQueue, processQueue, getQueueStatus, VALID_BET_AMOUNTS };
