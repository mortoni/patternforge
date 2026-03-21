# Creating training sets in data

Training sets are driven by:

1. **`imports/puzzle.csv`** – each row’s **`trainingSetId`** column is the **set / group id** (any stable string, e.g. `easy`, `test`, `openings`).
2. **Generated metadata** – built automatically from the CSV. The built-in ids `easy`, `intermediate`, and `advanced` get Woodpecker-style titles; other ids get a simple title from the id.

---

## How puzzles are assigned to sets

**`trainingSetId`** (first column) decides which set a row belongs to. You can use **any** group id (letters, numbers, `_`, `-`; max 64 chars).

**`difficulty`** is separate: it must be one of **`easy` \| `intermediate` \| `advanced` \| `custom`** (matches the app DB). It does **not** have to match `trainingSetId`.

Built-in ids still map to friendly names:

| `trainingSetId` | Generated set name (default)   |
|-----------------|--------------------------------|
| `easy`          | Woodpecker Easy                |
| `intermediate`  | Woodpecker Intermediate        |
| `advanced`      | Woodpecker Advanced            |
| anything else   | Title-cased id + short blurb   |

---

## Step 1: Custom set names

For non-built-in ids, display names are derived from the id (e.g. `my-drills` → “My Drills”). To change that, edit **`src/lib/puzzle-import.ts`** (`buildTrainingSetMetaFromPuzzles` / `CANONICAL_SET_META`) or adjust the generated `training-sets-meta.json` after generate.

---

## Step 2: Add puzzles in puzzle.csv

Edit **`data/imports/puzzle.csv`**. Columns:

| Column          | Required | Description |
|-----------------|----------|-------------|
| trainingSetId   | Yes      | Set / group id (any label; **which set** the puzzle belongs to) |
| puzzleNumber    | Yes      | Positive integer, unique within that set |
| fen             | Yes      | Starting position (FEN) |
| sideToMove      | Yes      | `w` or `b` |
| solutionMoves   | Yes      | Space-separated moves (SAN), e.g. `Nf7+` or `Re8 Rxe8 Qf8#` |
| motifTags       | No       | Comma-separated tags, e.g. `fork,checkmate` |
| gameSource      | No       | Label, e.g. `Lichess` |
| difficulty      | Yes      | `easy`, `intermediate`, `advanced`, or `custom` (tactical level for the exercise) |

Example: 2 puzzles in Easy, 1 in Intermediate, 1 in Advance

```csv
trainingSetId,puzzleNumber,fen,sideToMove,solutionMoves,motifTags,gameSource,difficulty
easy,1,"r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 4",w,"Nf7+",fork,Sample,easy
easy,2,"r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",w,"Qxf7#",checkmate,Sample,easy
intermediate,1,"r2qkb1r/ppp2ppp/2n1bn2/3pp1B1/3PP3/2N2N2/PPP2PPP/R2QKB1R w KQkq - 0 6",w,"Bxf6 Qxf6 Nxe5",pin,Sample,intermediate
advanced,1,"8/8/4k3/8/4K3/8/8/4R3 w - - 0 1",w,"Re6+",endgame,Sample,advanced
```

---

## Step 3: Validate and generate

```bash
pnpm run refresh-data        # Validate CSV + generate JSON (one command)
# Or separately:
pnpm run validate:puzzles    # Check CSV
pnpm run generate:puzzles    # Generate JSON
```

This writes:

- `data/generated/<id>-exercises.json` (e.g. `easy-exercises.json`)
- `data/generated/training-sets-meta.json`
- Same files under `public/data/generated/` for in-browser loading

---

## Step 4: Load into the app

Generated JSON is **not** written to IndexedDB by the scripts (Node has no IndexedDB). To create the training sets and exercises in the app:

- Use the in-app flow that loads from `/data/generated/` (e.g. seed or “Import from generated data”), or  
- Call the seed/import that reads the generated JSON and writes to Dexie (see README in project root).

---

## Summary

| Goal                         | Where to edit |
|-----------------------------|----------------|
| Set display names/descriptions | `src/lib/puzzle-import.ts` → `CANONICAL_SET_META` / `buildTrainingSetMetaFromPuzzles` |
| Which puzzles go in which set | `data/imports/puzzle.csv` → `trainingSetId` |
| Exercise difficulty label   | `data/imports/puzzle.csv` → `difficulty` |
| Add/remove puzzles           | `data/imports/puzzle.csv` (then validate + generate) |
