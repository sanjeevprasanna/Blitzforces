const redis = require("../../config/redis");
const repo = require("./duel.repository");
const { selectProblem } = require("../problem/problem.service");

const WIN_POINTS  = 10;
const LOSS_POINTS = -5;

// Called by matchmaking when a pair is found
async function createDuel({
  player1Id,
  player2Id,
  avgRating,
  duration,
  mode,
  betAmount = 0,
  isBot,
}) {
  // Select problem unsolved by both
  const problem = await selectProblem(player1Id, player2Id, avgRating);
  if (!problem) throw new Error("No eligible problem found");

  const duel = await repo.createDuel({
    player1Id,
    player2Id, // null if bot
    problemId: problem.id,
    mode,
    betAmount,
    durationMins: duration,
  });

  // Store duel metadata in Redis for fast poller access
  await redis.hSet(`duel:${duel.id}`, {
    player1Id: String(player1Id),
    player2Id: player2Id ? String(player2Id) : "bot",
    isBot: isBot ? "1" : "0",
    endsAt: String(duel.ends_at.getTime()),
    status: "active",
  });

  // WA counters
  await redis.hSet(`duel:${duel.id}:wa`, {
    [player1Id]: "0",
    ...(player2Id ? { [player2Id]: "0" } : {}),
  });

  // Schedule bot result if isBot
  if (isBot) {
    scheduleBotResult(duel.id, player1Id, duration);
  }

  return duel;
}

// Bot logic: 70% player wins, 30% bot wins
function scheduleBotResult(duelId, playerId, durationMins) {
  const botWins = Math.random() < 0.3;
  const durationMs = durationMins * 60 * 1000;
  // Bot solves between 60–90% of duration if it wins
  const botSolveMs = botWins
    ? Math.floor(durationMs * (0.6 + Math.random() * 0.3))
    : durationMs + 1000; // bot never solves if player should win

  setTimeout(async () => {
    try {
      const duel = await repo.getDuelById(duelId);
      if (!duel || duel.status !== "active") return;

      if (botWins) await finishDuel(duelId, "bot");
      // If bot doesn't win — poller handles player AC or timeout
    } catch (err) {
      console.error("[bot] Error scheduling bot result:", err.message);
    }
  }, botSolveMs);
}

// Called by CF poller when AC detected
async function handlePlayerAC(duelId, userId, submittedAt) {
  const duelMeta = await redis.hGetAll(`duel:${duelId}`);
  if (!duelMeta || duelMeta.status !== "active") return;

  const duel = await repo.getDuelById(duelId);
  if (!duel || duel.status !== "active") return;

  // Compute effective time with WA penalties
  const waCount = parseInt(
    (await redis.hGet(`duel:${duel.id}:wa`, String(userId))) ?? "0",
    10,
  );
  const solveMs = new Date(submittedAt) - new Date(duel.started_at);
  const effectiveMins = solveMs / 60000 + waCount;

  // Check if opponent already has AC
  const opponentId =
    duel.player1_id === userId ? duel.player2_id : duel.player1_id;
  const isBot = duelMeta.isBot === "1";

  if (!isBot && opponentId) {
    const opponentAC = await repo.hasAC(duelId, opponentId);
    if (opponentAC) {
      // Opponent already solved — they already won, ignore
      return;
    }
  }

  await finishDuel(duelId, userId);
}

// Finalize duel: set winner, update points, write history.
// winnerId can be null for a draw, or "bot" for a bot win.
async function finishDuel(duelId, winnerId) {
  // Mark as finished in Redis immediately to prevent double-finish
  const prev = await redis.hGet(`duel:${duelId}`, "status");
  if (prev === "finished") return;
  await redis.hSet(`duel:${duelId}`, "status", "finished");

  const duel = await repo.getDuelById(duelId);
  if (!duel) return;

  const isBot      = duel.player2_id === null;
  const p1Id       = duel.player1_id;
  const p2Id       = duel.player2_id;
  const isBetMode  = duel.mode === "bet" && duel.bet_amount > 0;
  const betAmount  = duel.bet_amount ?? 0;
  const botWon     = winnerId === "bot";

  if (winnerId && !botWon) {
    await repo.setDuelWinner(duelId, winnerId);
    const loserId = winnerId === p1Id ? p2Id : p1Id;

    if (isBetMode) {
      // Both already had bet_amount escrowed (deducted on joinQueue).
      // Winner receives 2x bet_amount (own back + opponent's).
      const winnerBefore = await repo.getUserPoints(winnerId);
      const winnerAfter  = await repo.updateUserPoints(winnerId, betAmount * 2);
      await repo.insertPointsHistory({
        userId: winnerId, duelId,
        pointsBefore: winnerBefore, pointsAfter: winnerAfter,
        delta: betAmount,
      });
      // Loser already had points deducted from escrow.
      if (loserId && !isBot) {
        const loserCurrent = await repo.getUserPoints(loserId);
        await repo.insertPointsHistory({
          userId: loserId, duelId,
          pointsBefore: loserCurrent + betAmount, // before escrow
          pointsAfter: loserCurrent,
          delta: -betAmount,
        });
      }
    } else {
      // Normal mode: fixed ±points
      const winnerBefore = await repo.getUserPoints(winnerId);
      const winnerAfter  = await repo.updateUserPoints(winnerId, WIN_POINTS);
      await repo.insertPointsHistory({
        userId: winnerId, duelId,
        pointsBefore: winnerBefore, pointsAfter: winnerAfter,
        delta: WIN_POINTS,
      });
      if (loserId && !isBot) {
        const loserBefore = await repo.getUserPoints(loserId);
        const loserAfter  = await repo.updateUserPoints(loserId, LOSS_POINTS);
        await repo.insertPointsHistory({
          userId: loserId, duelId,
          pointsBefore: loserBefore, pointsAfter: loserAfter,
          delta: LOSS_POINTS,
        });
      }
    }
  } else if (botWon) {
    await repo.setDuelTie(duelId);
    await redis.hSet(`duel:${duelId}`, "winner", "bot");
    if (isBetMode) {
      const playerCurrent = await repo.getUserPoints(p1Id);
      await repo.insertPointsHistory({
        userId: p1Id, duelId,
        pointsBefore: playerCurrent + betAmount,
        pointsAfter: playerCurrent,
        delta: -betAmount,
      });
    } else {
      const playerBefore = await repo.getUserPoints(p1Id);
      const playerAfter = await repo.updateUserPoints(p1Id, LOSS_POINTS);
      await repo.insertPointsHistory({
        userId: p1Id,
        duelId,
        pointsBefore: playerBefore,
        pointsAfter: playerAfter,
        delta: LOSS_POINTS,
      });
    }
  } else {
    // Tie / timeout
    await repo.setDuelTie(duelId);
    await redis.hSet(`duel:${duelId}`, "winner", "draw");
    // In bet mode: refund both players' escrowed bets
    if (isBetMode) {
      const [p1Before, p2Before] = await Promise.all([
        repo.getUserPoints(p1Id),
        p2Id ? repo.getUserPoints(p2Id) : Promise.resolve(0),
      ]);
      await repo.updateUserPoints(p1Id, betAmount);
      await repo.insertPointsHistory({
        userId: p1Id, duelId,
        pointsBefore: p1Before, pointsAfter: p1Before + betAmount,
        delta: betAmount,
      });
      if (p2Id) {
        await repo.updateUserPoints(p2Id, betAmount);
        await repo.insertPointsHistory({
          userId: p2Id, duelId,
          pointsBefore: p2Before, pointsAfter: p2Before + betAmount,
          delta: betAmount,
        });
      }
    }
  }

  // Cleanup Redis
  await Promise.all([
    redis.del(`duel:${duelId}:wa`),
    redis.del(`user:${p1Id}:active_duel`),
    ...(p2Id ? [redis.del(`user:${p2Id}:active_duel`)] : []),
    redis.hDel(`matchmaking:user:${p1Id}`, "duelId"),
    ...(p2Id ? [redis.hDel(`matchmaking:user:${p2Id}`, "duelId")] : []),
  ]);
}

// Called on timeout — if no AC from either player
async function handleDuelTimeout(duelId) {
  const duelMeta = await redis.hGetAll(`duel:${duelId}`);
  if (!duelMeta || duelMeta.status === "finished") return;

  const duel = await repo.getDuelById(duelId);
  if (!duel || duel.status !== "active") return;

  const p1AC = await repo.hasAC(duelId, duel.player1_id);
  if (p1AC) {
    await finishDuel(duelId, duel.player1_id);
    return;
  }
  if (duel.player2_id) {
    const p2AC = await repo.hasAC(duelId, duel.player2_id);
    if (p2AC) {
      await finishDuel(duelId, duel.player2_id);
      return;
    }
  }

  // Genuine tie / no solve
  await finishDuel(duelId, null);
}

async function getDuelStatus(duelId, userId) {
  const submissions = await repo.getSubmissions(duelId);
  const duel = await repo.getDuelById(duelId);
  if (!duel) throw new Error("Duel not found");

  const isBot = duel.player2_id === null;
  const duelMeta = await redis.hGetAll(`duel:${duelId}`);
  const redisWinner = duelMeta?.winner;
  const timeLeft = Math.max(0, new Date(duel.ends_at) - Date.now());

  return {
    id: duel.id,
    status: duel.status,
    mode: duel.mode,
    betAmount: duel.bet_amount ?? 0,
    isBot,
    timeLeftMs: timeLeft,
    problem: {
      id: `${duel.cf_contest_id}${duel.cf_index}`,
      title: duel.problem_title,
      rating: duel.problem_rating,
      cfUrl: `https://codeforces.com/problemset/problem/${duel.cf_contest_id}/${duel.cf_index}`,
    },
    players: {
      me: {
        handle: duel.player1_id === userId ? duel.p1_handle : duel.p2_handle,
        rating: duel.player1_id === userId ? duel.p1_rating : duel.p2_rating,
      },
      opponent: isBot
        ? { handle: "BlitzBot", rating: duel.p1_rating }
        : {
            handle:
              duel.player1_id === userId ? duel.p2_handle : duel.p1_handle,
            rating:
              duel.player1_id === userId ? duel.p2_rating : duel.p1_rating,
          },
    },
    winner: duel.winner_id,
    endsAt: duel.ends_at,
    submissions: submissions.map((s) => ({
      id: s.id,
      userId: s.user_id,
      handle: s.cf_handle,
      verdict: s.verdict,
      submittedAt: s.submitted_at,
      penaltyMinutes: s.penalty_minutes,
    })),
    winnerHandle:
      redisWinner === "bot"
        ? "BlitzBot"
        : duel.winner_id === duel.player1_id
        ? duel.p1_handle
        : duel.winner_id === duel.player2_id
          ? duel.p2_handle
          : null,
  };
}

async function forfeitDuel(duelId, forfeitingUserId) {
  const duel = await repo.getDuelById(duelId);

  if (!duel) {
    throw new Error("Duel not found");
  }

  if (duel.status !== "active") {
    throw new Error("Duel already finished");
  }

  const opponentId =
    duel.player1_id === forfeitingUserId ? duel.player2_id : duel.player1_id;

  await finishDuel(duelId, opponentId ?? "bot");
}

module.exports = {
  createDuel,
  handlePlayerAC,
  handleDuelTimeout,
  finishDuel,
  getDuelStatus,
  forfeitDuel,
};
