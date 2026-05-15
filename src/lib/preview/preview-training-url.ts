import type { BoardStyleId } from "@/lib/chess/board-styles";
import { ROUTES } from "@/lib/constants";

/** Tailwind-aligned preview breakpoints: device shell + iframe density/layout. */
export type PreviewScreenSize = "sm" | "md" | "lg";

export interface PreviewTrainingParams {
  /** Light/dark inside the iframe (`pfPreview`). */
  appearance: "light" | "dark";
  /** Exercise index (header: “Exercise n / …”). Selects a built-in demo FEN unless `fen` is set. */
  puzzle?: number;
  /** Denominator for exercise line. */
  total?: number;
  /** Cycle number. */
  cycle?: number;
  /** Training set label. */
  setName?: string;
  /**
   * `sm`: mobile phone + app-bar chrome; `md`: tablet frame + training layout (no app bar);
   * `lg`: desktop frame + training layout (wider board column).
   */
  screen?: PreviewScreenSize;
  /** Board palette (`classic` \| `blueprint`). Query key `board`. */
  boardStyle?: BoardStyleId;
  /**
   * Full FEN for the preview board (optional). Encoded in the URL as `fen`.
   * When set, overrides the position chosen from {@link puzzle}.
   */
  fen?: string;
}

/**
 * Builds the iframe `src` for {@link ROUTES.previewTraining} with stable query keys.
 */
export function buildPreviewTrainingUrl(params: PreviewTrainingParams): string {
  const q = new URLSearchParams();
  q.set("pfPreview", params.appearance);
  if (params.puzzle != null) q.set("puzzle", String(params.puzzle));
  if (params.total != null) q.set("total", String(params.total));
  if (params.cycle != null) q.set("cycle", String(params.cycle));
  if (params.setName != null && params.setName.length > 0) {
    q.set("set", params.setName);
  }
  if (params.screen != null) q.set("screen", params.screen);
  if (params.boardStyle != null) q.set("board", params.boardStyle);
  if (params.fen != null && params.fen.length > 0) {
    q.set("fen", params.fen.trim());
  }
  return `${ROUTES.previewTraining}?${q.toString()}`;
}
