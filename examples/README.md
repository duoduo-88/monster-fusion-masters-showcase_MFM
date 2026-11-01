# Generic code examples

[Back to Showcase](../README.md) · [Design and technical tour](../DESIGN.md) · [繁體中文](README.zh-TW.md)

These three standalone JavaScript files introduce basic concepts useful when building board-game interfaces. Each runs independently and prints to the terminal. They require no packages, game account, or online service.

## Run the examples

With Node.js available, run these commands from the Showcase repository root:

```sh
node examples/hex-grid-example.js
node examples/tile-orientation-example.js
node examples/ui-state-example.js
```

## Hex coordinates

[`hex-grid-example.js`](hex-grid-example.js) uses axial coordinates `(q, r)` to demonstrate conversion to drawing coordinates, lookup of six neighbors, and distance between two cells.

The example starts at `(2, -1)` and prints a distance of `2` from the origin. Converted positions are drawing coordinates; board shape and legal placement locations still need definitions based on the game rules.

## Six rotation orientations

[`tile-orientation-example.js`](tile-orientation-example.js) represents six edges as array positions. Rotation shifts array indices and normalizes rotation steps into six orientations.

One clockwise step turns `[A, B, C, D, E, F]` into `[F, A, B, C, D, E]`. The letters are sample labels. Direction names and edge numbering are conventions for this example, rather than the official MFM rules or production data format.

## Interface state

[`ui-state-example.js`](ui-state-example.js) uses a reducer to demonstrate updates to a screen name, notice text, and busy flag. Each update returns a new state object so the effect of an action is easy to follow.

The final state is `screen: "settings"`, `notice: "Saving preferences…"`, and `busy: true`. The notice is sample text; the script performs no save operation.

## Relationship to the official rules

These examples are starting points for individual technical concepts. To implement the same game rules, consult the Wiki's [game rules](https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/en/rules.html) for basic play, legal actions, scoring, and special cases, and [modes and competition](https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/en/modes.html) for competitive systems.
