# Protocol Craft

**Infinite Craft, but for networking protocols.** You start with eight basic
elements and combine them, two at a time, to discover ~470 real networking
protocols — all the way from a single electron up through the seven layers of
the OSI model to a secure web page (HTTPS).

It runs entirely in your browser, works offline, and is hosted on Cloudflare
Workers at **netcraft.clydeford.net**.

---

## How to play

1. The panel on the **left** is your shelf — everything you've discovered. You
   begin with eight: Electron, Copper, Glass, Air, Clock, Number, Rule, Cisco.
2. **Tap an element** on the left to bring a copy onto the board in the middle.
3. **Drag one element onto another** — or tap one, then tap a second — to
   combine them.
   - If they make something, it appears with a little flourish and a card
     telling you, in one plain sentence, what that protocol actually is. It's
     added to your shelf.
   - If they don't, you get a short message like *"Nothing routable here"* and
     nothing breaks.
4. The number at the top counts your discoveries. There's no "X of Y" total —
   you won't know how much is left. That's deliberate.
5. **Lab Notes** (top-right) is the glossary of everything you've found, grouped
   by layer, with each one's description — a reference book you've earned.
6. **Reset** wipes everything back to the original eight (it asks first).

Some landmarks fire a little fanfare when you reach them — Ethernet, IP, ARP,
OSPF, BGP-4, TCP, TLS, DNS, SSH — and the very top of the stack, **HTTPS**, gets
the big one.

Your progress is saved automatically in your own browser; nothing is sent
anywhere.

---

## What's in the project, file by file

Think of the project in two halves: **the "brain"** (the content and the rules)
and **the "game"** (what you see and click). Plus the tools that connect them.

### The brain — content and rules

- **`protocol_tree.md`** — The master list. Every element and the recipe that
  makes it, written as plain `A + B → C` lines, organised by network layer.
  This is the single source of truth. If you want to change what combines into
  what, you edit this file. Nothing is invented elsewhere.

- **`data/elements.json`** — The hand-written descriptions. For each element
  that needed one, this holds the one-sentence "what it is" you see on the
  discovery card, plus which landmarks count as milestones. (Many descriptions
  are written right into `protocol_tree.md` next to the recipe; this file fills
  in the rest.)

### The tools that connect the two halves

- **`scripts/parse.js`** — The translator. It reads `protocol_tree.md`, pulls
  out every recipe and description, works out each element's layer (which sets
  its colour), and writes the finished data the game reads. If any element is
  ever left without a description, it stops and tells you — so the content can
  never be half-finished.

- **`scripts/validate.js`** — The inspector. It checks the data makes sense:
  every element can actually be built from the starting eight, no two recipes
  clash, and nothing is unreachable. It prints a pass/fail report.

- **`scripts/deploy.js`** — The publish button. It re-checks the data, then
  pushes the game live to Cloudflare. It reads your login details from `.env`.

### The game — what you see

Everything in **`public/`** is the actual website. This is exactly what gets
published; there's no separate build step.

- **`public/index.html`** — The page's skeleton: the top bar, the shelf, the
  board, the Lab Notes drawer.
- **`public/styles.css`** — All the looks: the dark theme, the colour for each
  network layer, the chip design, the animations. Every graphic is drawn with
  code (colour and shape) — there are no image files to download.
- **`public/app.js`** — The game itself: loading the data, the dragging and
  combining, the discovery cards, Lab Notes, saving your progress.
- **`public/data/recipes.json`** — The finished data file the game loads. You
  don't edit this by hand — `scripts/parse.js` writes it for you.

### Setup and housekeeping

- **`wrangler.toml`** — Tells Cloudflare how to host the game (serve the
  `public/` folder at netcraft.clydeford.net).
- **`package.json`** — The list of shortcut commands (below).
- **`.env`** — Your private login keys for Cloudflare etc. **Never share this
  file or put it online.** It's deliberately kept out of the published site and
  out of version control.
- **`.gitignore`** — Makes sure `.env` and other private files are never
  committed by accident.
- **`mockups/graphics-options.html`** — A throwaway page used while choosing the
  visual style. Not part of the game.

---

## Commands

Run these in a terminal from the project folder (they need
[Node.js](https://nodejs.org) installed):

| Command | What it does |
|---|---|
| `npm run serve` | Preview locally using Cloudflare's own runtime (`wrangler dev`) |
| `npm run build` | Re-translate `protocol_tree.md` → game data, then check it |
| `npm run validate` | Just run the checks |
| `npm run deploy` | Publish the game live to Cloudflare |

### Changing the game's content

1. Edit `protocol_tree.md` (to change recipes) or `data/elements.json` (to
   change descriptions).
2. Run `npm run build`. If it complains, it'll tell you exactly what's wrong.
3. Run `npm run serve` to try it.
4. Run `npm run deploy` when you're happy.

---

## A note for later (v2)

Right now the game is completely self-contained and makes no calls to the
internet — every combination is decided by the recipe list. There's a clearly
marked, switched-off hook in `public/app.js` (`tryLiveAICombine`) where a future
version could ask an AI to invent a result for combinations that aren't in the
list. It does nothing today.
