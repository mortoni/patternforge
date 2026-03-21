/**
 * MT (dark) board style: black pieces get a crisp white outline (reference-style)
 * by stacking directional drop-shadows on the default react-chessboard SVGs.
 * White pieces are unchanged.
 */

import * as React from "react";
import { defaultPieces } from "react-chessboard";
import type { PieceRenderObject } from "react-chessboard";

type PieceProps = Parameters<
  NonNullable<PieceRenderObject[keyof PieceRenderObject]>
>[0];

/** Cardinal offsets approximate a 1px stroke around filled black shapes. */
const BLACK_PIECE_WHITE_OUTLINE_FILTER = [
  "drop-shadow(0 1px 0 rgba(255,255,255,0.95))",
  "drop-shadow(0 -1px 0 rgba(255,255,255,0.95))",
  "drop-shadow(1px 0 0 rgba(255,255,255,0.95))",
  "drop-shadow(-1px 0 0 rgba(255,255,255,0.95))",
  "drop-shadow(0 1.5px 0.5px rgba(255,255,255,0.25))",
].join(" ");

function withBlackPieceWhiteOutline(
  Original: (props?: PieceProps) => React.JSX.Element
): (props?: PieceProps) => React.JSX.Element {
  return (props) => {
    const el = Original(props);
    if (!React.isValidElement(el)) return el;
    const prev = (el.props as { style?: React.CSSProperties }).style;
    const mergedFilter = [BLACK_PIECE_WHITE_OUTLINE_FILTER, prev?.filter]
      .filter(Boolean)
      .join(" ");
    return React.cloneElement(
      el as React.ReactElement<{ style?: React.CSSProperties }>,
      {
        style: {
          ...prev,
          filter: mergedFilter,
        },
      }
    );
  };
}

/** Same default pieces as the library, except black pieces gain a white edge. */
export const MT_MODEL_PIECES: PieceRenderObject = {
  ...defaultPieces,
  bP: withBlackPieceWhiteOutline(defaultPieces.bP),
  bR: withBlackPieceWhiteOutline(defaultPieces.bR),
  bN: withBlackPieceWhiteOutline(defaultPieces.bN),
  bB: withBlackPieceWhiteOutline(defaultPieces.bB),
  bQ: withBlackPieceWhiteOutline(defaultPieces.bQ),
  bK: withBlackPieceWhiteOutline(defaultPieces.bK),
};
