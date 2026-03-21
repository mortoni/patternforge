"use client";

function cleanGameSourceTitle(source: string): string {
  const trimmed = source.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export interface MistakeReviewGameContextProps {
  gameSource?: string;
  note?: string;
}

export function MistakeReviewGameContext({
  gameSource,
  note,
}: MistakeReviewGameContextProps) {
  const sourceTitle =
    gameSource != null && gameSource.trim() !== ""
      ? cleanGameSourceTitle(gameSource)
      : null;
  const contextNote =
    note != null && note.trim() !== ""
      ? note.trim()
      : "Context note: focus on the tactical idea and why this first move works in the game position.";

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
      <p className="max-h-23 overflow-hidden text-xs leading-relaxed text-muted-foreground">
        {contextNote}
      </p>
    </section>
  );
}
