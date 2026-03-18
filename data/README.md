# Creating training sets in data

The app has **3 training sets** (Woodpecker Easy, Woodpecker Intermediate, Woodpecker Advance). They are driven by:

1. **`imports/puzzle.csv`** – each row’s **`trainingSetId`** column says which set that puzzle belongs to.
2. **`scripts/generate-puzzle-json.ts`** – the `TRAINING_SET_META` array defines each set’s display name and description.

---

## How puzzles are assigned to sets

**In `puzzle.csv`, the first column is `trainingSetId`.** That value is what sends each puzzle to a set:

| Put this in `trainingSetId` | Puzzle goes into this set           |
|-----------------------------|-------------------------------------|
| `easy`                      | **Woodpecker Easy**                 |
| `intermediate`              | **Woodpecker Intermediate**         |
| `advanced`                  | **Woodpecker Advance**              |

So:
- Rows with `trainingSetId,easy` and `difficulty,easy` → Woodpecker Easy  
- Rows with `trainingSetId,intermediate` and `difficulty,intermediate` → Woodpecker Intermediate  
- Rows with `trainingSetId,advanced` and `difficulty,advanced` → Woodpecker Advance  

The **`difficulty`** column must match **`trainingSetId`** (validation requires it).

---

## Step 1: Set names and descriptions (optional)

Edit **`scripts/generate-puzzle-json.ts`** and change the `TRAINING_SET_META` array if you want different names or descriptions. The ids (`easy`, `intermediate`, `advanced`) must stay as they are.

---

## Step 2: Add puzzles in puzzle.csv

Edit **`data/imports/puzzle.csv`**. Columns:

| Column          | Required | Description |
|-----------------|----------|-------------|
| trainingSetId   | Yes      | `easy`, `intermediate`, or `advanced` – **this decides which set the puzzle goes in** |
| puzzleNumber    | Yes      | Positive integer, unique within that set |
| fen             | Yes      | Starting position (FEN) |
| sideToMove      | Yes      | `w` or `b` |
| solutionMoves   | Yes      | Space-separated moves (SAN), e.g. `Nf7+` or `Re8 Rxe8 Qf8#` |
| motifTags       | No       | Comma-separated tags, e.g. `fork,checkmate` |
| gameSource      | No       | Label, e.g. `Lichess` |
| difficulty      | Yes      | Must equal `trainingSetId`: `easy`, `intermediate`, or `advanced` |

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
| Set display names/descriptions | `scripts/generate-puzzle-json.ts` → `TRAINING_SET_META` |
| Which puzzles go in which set | `data/imports/puzzle.csv` → `trainingSetId` and `difficulty` |
| Add/remove puzzles           | `data/imports/puzzle.csv` (then validate + generate) |
