"use client";

/**
 * PatternForge training board: Chessground with chess.js as the rule engine.
 * Consumers depend on {@link PatternBoardProps} only.
 */

import * as React from "react";
import { Chess, type Square } from "chess.js";
import { Chessground } from "chessground";
import type { Api } from "chessground/api";
import type { Config } from "chessground/config";
import { renderResized, updateBounds } from "chessground/render";
import type { Color, Key } from "chessground/types";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";
import "./pattern-board.css";
import type { ResolvedBoardChessStyles } from "@/lib/chess/board-styles";
import { getSquaresFromUci } from "@/lib/chess/move-highlights";
import {
  buildLegalDests,
  newFenAfterVerbose,
  pickVerboseMove,
  uciFromMove,
} from "@/lib/chess/training-move-helpers";
import { MOVE_ANIMATION_MS } from "@/features/training/training-board-timing";

export interface PatternBoardProps {
  fen: string;
  boardOrientation: Color;
  /**
   * When this value changes (e.g. exercise id), the board skips Chessground’s
   * cross-position piece animation (which feels laggy between unrelated puzzles)
   * and clears last-move highlights.
   */
  positionSyncKey?: string;
  onMove?: (uci: string, newFen: string) => void;
  onPreMove?: (uci: string) => void;
  disabled?: boolean;
  preMoveEnabled?: boolean;
  preMoveSide?: "w" | "b";
  correctMoveSquares?: string[];
  attemptedMoveSquares?: string[];
  correctMoveUci?: string;
  surface: ResolvedBoardChessStyles;
  /** When false, Chessground file/rank labels are hidden (e.g. marketing previews). */
  showCoordinates?: boolean;
  /**
   * Landing marketing iframe only: narrower dark-mode black-piece rim (~0.5px via CSS).
   * Training app boards omit this attribute and keep the default ~1px outline.
   */
  marketingEmbed?: boolean;
  /**
   * Editorial / marketing diagrams: refined piece treatment via pattern-board.css.
   */
  editorialBoard?: boolean;
  /** Squares that receive subtle accent highlight (e.g. mating knight). */
  editorialAccentSquares?: string[];
}

function mapSideToCgColor(side: "w" | "b"): Color {
  return side === "w" ? "white" : "black";
}

function turnColorFromFen(fen: string): Color {
  try {
    return new Chess(fen).turn() === "w" ? "white" : "black";
  } catch {
    return "white";
  }
}

/** Pre-move queue UCI when turn info is implicit; prefer queen on promotion. */
function uciFromSquaresGuess(fen: string, orig: Key, dest: Key): string | null {
  try {
    const c = new Chess(fen);
    const piece = c.get(orig as Square);
    if (!piece) return null;
    if (piece.type === "p" && (dest[1] === "8" || dest[1] === "1")) {
      return `${orig}${dest}q`;
    }
    return `${orig}${dest}`;
  } catch {
    return null;
  }
}

function buildHostStyle(surface: ResolvedBoardChessStyles): React.CSSProperties {
  const base: React.CSSProperties = {
    width: "100%",
    height: "100%",
    ...(surface.boardStyle ?? {}),
  };
  const r = base as Record<string, string>;
  if (surface.cgBoardAppearance) {
    const c = surface.cgBoardAppearance;
    if (c.backgroundColor != null)
      r["--pf-cg-board-bg"] = String(c.backgroundColor);
    if (c.backgroundImage != null)
      r["--pf-cg-board-image"] = String(c.backgroundImage);
    if (c.backgroundSize != null)
      r["--pf-cg-board-size"] = String(c.backgroundSize);
  }
  if (surface.coordColor) {
    r["--pf-cg-coords"] = surface.coordColor;
  }
  return base;
}

export function PatternBoard({
  fen,
  boardOrientation,
  positionSyncKey,
  onMove,
  onPreMove,
  disabled = false,
  preMoveEnabled = false,
  preMoveSide,
  correctMoveSquares,
  attemptedMoveSquares,
  correctMoveUci,
  surface,
  showCoordinates = true,
  marketingEmbed = false,
  editorialBoard = false,
  editorialAccentSquares,
}: PatternBoardProps) {
  const elRef = React.useRef<HTMLDivElement | null>(null);
  const apiRef = React.useRef<Api | null>(null);
  const prevPositionSyncRef = React.useRef<string | undefined>(undefined);

  const onMoveRef = React.useRef(onMove);
  const onPreMoveRef = React.useRef(onPreMove);
  const fenRef = React.useRef(fen);

  React.useLayoutEffect(() => {
    onMoveRef.current = onMove;
    onPreMoveRef.current = onPreMove;
    fenRef.current = fen;
  }, [onMove, onPreMove, fen]);

  const highlightCustom = React.useMemo(() => {
    const m = new Map<Key, string>();
    if (correctMoveSquares?.length) {
      for (const sq of correctMoveSquares) {
        m.set(sq as Key, "pf-hl-correct");
      }
    }
    if (attemptedMoveSquares?.length) {
      for (const sq of attemptedMoveSquares) {
        if (!m.has(sq as Key)) m.set(sq as Key, "pf-hl-attempted");
      }
    }
    if (editorialAccentSquares?.length) {
      for (const sq of editorialAccentSquares) {
        m.set(sq as Key, "pf-hl-editorial-accent");
      }
    }
    return m;
  }, [correctMoveSquares, attemptedMoveSquares, editorialAccentSquares]);

  const autoShapes = React.useMemo(() => {
    if (!correctMoveUci) return [] as { orig: Key; dest: Key; brush: string }[];
    const pair = getSquaresFromUci(correctMoveUci);
    if (!pair) return [];
    return [
      {
        orig: pair[0] as Key,
        dest: pair[1] as Key,
        brush: "green",
      },
    ];
  }, [correctMoveUci]);

  const hostStyle = React.useMemo(
    () => buildHostStyle(surface),
    [surface]
  );

  const applyConfig = React.useCallback(
    (api: Api) => {
      const turn = turnColorFromFen(fen);
      const userColor: Color | undefined = preMoveSide
        ? mapSideToCgColor(preMoveSide)
        : undefined;

      const allowPreMoveQueue =
        disabled && preMoveEnabled && Boolean(onPreMove);

      const viewOnly =
        (!onMove && !onPreMove) || (disabled && !allowPreMoveQueue);

      let premovableEnabled = false;
      let movableDests = buildLegalDests(fen);
      let movableColor: Color | undefined;
      let premovableEvents:
        | { set?: (orig: Key, dest: Key) => void }
        | undefined;

      if (viewOnly) {
        movableColor = undefined;
        movableDests = new Map();
      } else if (allowPreMoveQueue && userColor) {
        const userTurn =
          (turn === "white" && userColor === "white") ||
          (turn === "black" && userColor === "black");
        if (userTurn) {
          movableColor = userColor;
          premovableEnabled = false;
        } else {
          movableColor = userColor;
          premovableEnabled = true;
          movableDests = new Map();
          premovableEvents = {
            set: (orig, dest) => {
              const uci = uciFromSquaresGuess(fenRef.current, orig, dest);
              if (uci) onPreMoveRef.current?.(uci);
              api.cancelPremove();
              api.set({ fen: fenRef.current });
            },
          };
        }
      } else if (onMove) {
        movableColor = turn;
        premovableEnabled = false;
        premovableEvents = undefined;
      } else {
        movableColor = undefined;
        movableDests = new Map();
      }

      const after = (orig: Key, dest: Key) => {
        const posFen = fenRef.current;
        const chosen = pickVerboseMove(posFen, orig, dest);
        if (!chosen) {
          api.set({ fen: posFen });
          return;
        }
        const newFen = newFenAfterVerbose(posFen, chosen);
        if (!newFen) {
          api.set({ fen: posFen });
          return;
        }
        const uci = uciFromMove(chosen);

        if (allowPreMoveQueue && onPreMoveRef.current) {
          onPreMoveRef.current(uci);
          api.set({ fen: posFen });
          return;
        }
        onMoveRef.current?.(uci, newFen);
        api.set({ fen: newFen });
      };

      const needsInstantJump =
        positionSyncKey !== undefined &&
        positionSyncKey !== prevPositionSyncRef.current;

      if (needsInstantJump) {
        api.set({
          animation: { enabled: false, duration: MOVE_ANIMATION_MS },
        });
        prevPositionSyncRef.current = positionSyncKey;
      }

      api.set({
        fen,
        orientation: boardOrientation,
        turnColor: turn,
        viewOnly,
        coordinates: showCoordinates,
        coordinatesOnSquares: false,
        autoCastle: true,
        animation: {
          enabled: true,
          duration: MOVE_ANIMATION_MS,
        },
        highlight: {
          lastMove: true,
          check: true,
          custom: highlightCustom,
        },
        movable: {
          free: false,
          color: viewOnly ? undefined : movableColor,
          dests: movableDests,
          showDests: true,
          events: { after },
        },
        premovable: {
          enabled: premovableEnabled,
          showDests: true,
          events: premovableEvents,
        },
        draggable: {
          enabled: !viewOnly,
          distance: 8,
        },
        selectable: { enabled: true },
        drawable: {
          enabled: false,
          visible: true,
          defaultSnapToValidMove: false,
          eraseOnClick: false,
          shapes: [],
          autoShapes,
        },
        /* configure() treats lastMove: false as “clear”; Config types only list Key[] */
        ...(needsInstantJump ? { lastMove: false } : {}),
      } as Config);
    },
    [
      fen,
      positionSyncKey,
      boardOrientation,
      disabled,
      preMoveEnabled,
      preMoveSide,
      onMove,
      onPreMove,
      highlightCustom,
      autoShapes,
      showCoordinates,
    ]
  );

  React.useLayoutEffect(() => {
    if (!elRef.current) return undefined;
    const api = Chessground(elRef.current, {
      coordinates: showCoordinates,
      coordinatesOnSquares: false,
    });
    apiRef.current = api;
    return () => {
      api.destroy();
      apiRef.current = null;
    };
  }, [showCoordinates]);

  React.useLayoutEffect(() => {
    if (!apiRef.current) return;
    applyConfig(apiRef.current);
  }, [applyConfig]);

  /**
   * Recompute square/piece translations when the host size changes — same path as Chessground's
   * internal ResizeObserver, but rerun after hydration so cached bounds aren't stuck on stale layout
   * (embeds flex/aspect clamps, previews, ancestor transforms finishing one frame later).
   */
  React.useEffect(() => {
    const host = elRef.current;
    const api = apiRef.current;
    if (!host || !api || typeof ResizeObserver === "undefined") return undefined;
    let raf = 0;
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        updateBounds(api.state);
        renderResized(api.state);
      });
    };
    const ro = new ResizeObserver(sync);
    ro.observe(host);
    sync();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const hostClass = ["pf-cg-host", "pf-cg-board--grid"].join(" ");

  return (
    <div
      ref={elRef}
      className={hostClass}
      data-pf-board={surface.boardStyleId}
      data-pf-marketing-embed={marketingEmbed ? "true" : undefined}
      data-pf-editorial-board={editorialBoard ? "true" : undefined}
      style={hostStyle}
    />
  );
}
