"use client";

import * as React from "react";

function cleanGameSourceTitle(source: string): string {
  const trimmed = source.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/** Shown when the exercise carries no source note; generic, so never a spoiler. */
const FALLBACK_NOTE =
  "Context note: focus on the tactical idea and why this first move works in the game position.";

export interface MistakeReviewGameContextProps {
  gameSource?: string;
  note?: string;
  /**
   * Reveal the note without asking. Used once the attempt is resolved, when the
   * answer is no longer a spoiler.
   */
  revealed?: boolean;
}

/**
 * Game context beside the review board.
 *
 * The source note is usually the puzzle's annotated solution line (e.g.
 * "1.Rf8+ Bxf8 2.d6+ Be6 3.Bxe6 mate"), so it stays behind a "Show solution"
 * disclosure — otherwise reviewing a mistake is not a real test. The game
 * title itself is not a spoiler and stays visible.
 */
export function MistakeReviewGameContext({
  gameSource,
  note,
  revealed = false,
}: MistakeReviewGameContextProps) {
  const sourceTitle =
    gameSource != null && gameSource.trim() !== ""
      ? cleanGameSourceTitle(gameSource)
      : null;
  const sourceNote = note != null && note.trim() !== "" ? note.trim() : null;

  const noteId = React.useId();
  const [showNote, setShowNote] = React.useState(revealed);

  // Auto-reveal once the attempt resolves; re-hide when the next puzzle loads.
  React.useEffect(() => {
    setShowNote(revealed);
  }, [revealed, sourceNote]);

  return (
    <section className="space-y-2.5 pt-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
        Game context
      </p>
      {sourceTitle != null ? (
        <p className="text-sm font-medium leading-snug text-foreground">{sourceTitle}</p>
      ) : (
        <p className="text-sm font-medium leading-snug text-foreground">
          From the original game
        </p>
      )}

      {sourceNote == null ? (
        <p className="max-h-23 overflow-hidden text-xs leading-relaxed text-muted-foreground">
          {FALLBACK_NOTE}
        </p>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowNote((open) => !open)}
            aria-expanded={showNote}
            aria-controls={noteId}
            className="text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            {showNote ? "Hide solution" : "Show solution"}
          </button>
          {showNote ? (
            <p
              id={noteId}
              className="max-h-23 overflow-hidden text-xs leading-relaxed text-muted-foreground"
            >
              {sourceNote}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
