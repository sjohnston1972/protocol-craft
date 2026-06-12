# Protocol Craft — Claude Code build prompt

Paste everything below the line into Claude Code, run from an empty folder
containing `protocol-craft-map.md` (the recipe map).

---

Build a web game called **Protocol Craft** — Infinite Craft, but for networking protocols.

## Source of truth

The file `protocol_tree.md` in this folder contains the complete recipe map:
8 starting elements, ~30 concept cards, ~150 protocols, written as `A + B → C`
lines with occasional glosses. Parse it into a structured recipe table
(`data/recipes.json`) as your first task. Do not invent, rename, or drop recipes —
the map is canonical. If a line is ambiguous, list your interpretation in a
comment rather than silently changing it.

## Tech stack

- Single-page app: vanilla HTML/CSS/JS or React + Vite, you choose but make it look fantastic, State lives in localStorage.
- It must be hosted in cloudflare workers. use .env to get access, netcraft.clydeford.net

## Core gameplay

1. A sidebar shelf of discovered elements; the board starts with the 8 starting
   elements: Electron, Copper, Glass, Air, Clock, Number, Rule, Cisco.
2. Drag (or tap-to-select on mobile) two elements together to combine them.
3. If the pair matches a recipe in the table → reveal the result with a
   satisfying animation, add it to the shelf, and show a **one-line discovery
   card**: what the protocol actually is, in one plain sentence. Write these
   discovery lines yourself for every node in the map at build time and store
   them in the recipe table — accurate, dry-humoured where it fits, never
   waffly.
4. If the pair matches no recipe → show a short in-character miss message
   ("Nothing routable here") rather than an error. Do NOT call any external AI
   API; the game is fully offline. (Live AI for off-recipe combos is a possible
   v2 — leave a clearly marked extension point in the code for it.)
5. Order of a pair never matters. A+B and B+A are the same combination.
6. Duplicate discoveries do nothing except briefly highlight the existing
   element on the shelf.

## Progression & feel

- Mysterious mode: NO total count, no "x of y" tracker. Just a discoveries
  counter counting up.
- Tier-coloured elements: starting elements / concepts / L2 / L3 / Layer 2.5 /
  disasters (Broadcast Storm, Address Exhaustion get special menacing styling).
- Milestone toasts on landmark nodes: Ethernet, ARP, IP, OSPF, BGP-4 (BGP gets
  a proper fanfare — it's the summit).
- A "Lab Notes" panel listing every discovery with its one-liner, so the shelf
  doubles as a glossary the player has personally earned.
- Search/filter on the shelf once it grows past ~20 elements.
- Reset button with a confirm step.

## Validation (do this before building UI)

Write `scripts/validate.js` and run it as part of the build:
- Every recipe's ingredients are reachable from the 8 starting elements
  (topological reachability check).
- No A+B pair maps to two different results (order-insensitive).
- Every node in the map appears as the result of at least one recipe, except
  the 8 starting elements.
Print a report; fail loudly if any check fails. Fix clashes by flagging them to
me, not by silently rewriting the map.

## Style

- Dark theme, terminal-adjacent but polished — closer to a modern dashboard
  than green-on-black cosplay. Subtle. No emoji.
- Mobile-friendly: I will mostly poke at this on a phone.

## Process

1. Parse map → recipes.json
2. Run validation, report results to me before continuing
3. Build the game
4. Write a short README explaining the project structure file-by-file, in
   plain English, for someone who doesn't code — what each file does and why
   it exists.

Ask me before making any decision that changes gameplay. Decisions that are
purely technical, just make and note in the README.