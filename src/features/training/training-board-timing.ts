/**
 * Central tuning knobs for training board motion and sequencing.
 * Adjust here for Lichess-like feel without hunting through components.
 */

/** Piece move animation duration; matched to Chessground in PatternBoard. */
export const MOVE_ANIMATION_MS = 220;

/** Brief beat after a move animation so the eye registers the new position. */
export const POST_MOVE_SETTLE_MS = 120;

/**
 * Pause after the player’s move (and its animation) before applying the opponent reply.
 */
export const AUTO_REPLY_DELAY_MS = 260;

/**
 * Wait from successful submit until the opponent FEN is applied (player anim + settle + pause).
 */
export const OPPONENT_REPLY_TOTAL_DELAY_MS =
  MOVE_ANIMATION_MS + POST_MOVE_SETTLE_MS + AUTO_REPLY_DELAY_MS;

/**
 * Delay before “wrong / solved” full-screen transition so the last move can finish animating.
 */
export const PUZZLE_RESOLVE_UI_DELAY_MS =
  MOVE_ANIMATION_MS + POST_MOVE_SETTLE_MS;

/**
 * After a correct partial line, how long the board stays in `correct_so_far` before unlocking.
 */
export const POST_CORRECT_IDLE_DELAY_MS = 500;

/** After the “Exercise complete” overlay, time before navigation or silent reload. */
export const EXERCISE_TRANSITION_MS = 550;
