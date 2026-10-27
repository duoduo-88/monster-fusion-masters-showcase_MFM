# Monster Fusion Masters

**Official game wiki (rules, scoring and development history):** [MFM Wiki](https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/)

**Showcase repository:** `monster-fusion-masters-showcase_MFM`

![Monster Fusion Masters showcase cover](assets/showcase-cover.png?v=d8be5338)

**Play / Live Game:** [https://monsterfusionmasters.com/](https://monsterfusionmasters.com/)

## Play Monster Fusion Masters

- [Play Online — Browser Version](https://monsterfusionmasters.com/)
- [Download MFM Desktop — Windows x64](https://github.com/duoduo-88/monster-fusion-masters-showcase_MFM/releases/latest)

MFM Desktop is a portable Windows application powered by Microsoft Edge WebView2. No installation is required: extract the ZIP and run `MFMDesktop.exe`.

Requires the Microsoft Edge WebView2 Evergreen Runtime. It is included with Windows 11 and is already installed on most Windows 10 devices. If it is missing, [download the Runtime from Microsoft](https://developer.microsoft.com/microsoft-edge/webview2/).

This release is not code-signed, so Windows may show a SmartScreen warning for an unrecognized app.

Monster Fusion Masters is an original competitive strategy board game. I designed it first as a physical tabletop game; Codex later helped turn that existing design into working software.

## System requirements (preliminary)

| Component | Basic reference | Suggested (estimated) |
| --- | --- | --- |
| CPU | 3rd-generation Intel Core (observed reference only) | 8th-generation Intel Core or newer (estimated) |
| RAM | 8 GB (not validated) | 16 GB |
| GPU | Intel HD Graphics 4000 class (observed) | Intel UHD Graphics 630 class or better |

On one laptop with i7-3520M + Intel HD 4000 + 16 GB RAM, MFM Desktop (WebView2) generally showed around 30 FPS and sometimes dropped to approximately 16 FPS during heavy effects. This is not a fixed-FPS guarantee; 8 GB RAM and other combinations remain unvalidated. The desktop version requires 64-bit Windows 10/11 and WebView2 Runtime.

See the [MFM system requirements Wiki](https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/en/requirements.html).

## Features

- Free-to-play, browser-based gameplay
- Real-time multiplayer PvP and rooms
- AI opponents and ranked matches
- Spectator mode and a beginner tutorial
- English and Traditional Chinese interface

## Interface tour

These screenshots were captured from a local demo session with sample player and room data. The live interface may change as the game develops.

### Lobby

![Lobby showing player stats, ranked matchmaking, room list, and online players](assets/lobby.png)

The lobby brings the main ways to play together. Check your rating, win rate, season rank, and leaderboard; find a ranked match; or create, join, and watch rooms. The player panel also links to replays, the guided tutorial, and the Color Lab, while the right side lists players currently online.

### Room

![Room showing player and spectator slots, color choices, invite QR code, and match controls](assets/room.png)

Rooms support up to four players plus spectators. Share the room code, invitation link, or QR code; choose a player color; and set the turn timer. The host can add a CPU opponent and start the match when the room is ready.

### Color Lab

![Color Lab showing its palette library, pattern controls, color code, and preview board](assets/color-lab.png)

Design a player color with a pattern, base and accent colors, and fine controls such as size, angle, and texture. Try it on the practice board, save it to your local palette library, or copy and load a color code to share the design.

### Battle

![Battle showing the hex board, tile hand, player scores, deck, and game log](assets/battle.png)

The battle screen centers on a 61-cell hex board. Select a tile from your hand, rotate it, preview a placement, and place it on a legal cell. The side panel tracks the deck, player scores, and game log; the top of the board shows the round and turn.

## Build process

### 1. Original tabletop game — 2020

Monster Fusion Masters began as an original tabletop strategy game I designed. The core concept, board and tile designs, rules, scoring, balance decisions, and physical edition existed before the current AI-assisted development. In 2020, I published a 3D-printable version: [Monster Fusion Masters V1 board game](https://www.printables.com/model/35556-monster-fusion-masters-v1board-game).

### 2. The idea of a digital version

I wanted to make the game digital and online, but I lacked game development and programming experience, knowledge of multiplayer and server development, and the budget needed to build a complete game. I could not take it from a tabletop design to an online game on my own.

### 3. Project put on hold

I tried to find outside development help, but the cost and scale of the project made it difficult to get underway. The digital version stayed on hold for years.

### 4. Reviving the project with Codex

As AI-assisted software development matured, I returned to the project. Codex helps implement the existing game design as software; it did not create the game, its rules, or its balance. Its assistance has included:

- Translating existing rules into code
- Implementation planning and code analysis
- Debugging and refactoring
- UI and multiplayer implementation
- Iterative development

### 5. First playable digital version

The tabletop design was gradually turned into a browser-playable game. This involved representing the board state, tile placement, turns, scoring, game flow, and a playable interface in software. This overview describes the work at a high level and does not include the production implementation.

### 6. Online multiplayer

Online competitive play required rooms, synchronized player and game state, spectator support, and multiplayer infrastructure. The live service uses Cloudflare Workers and Durable Objects. The server implementation is not part of this showcase repository.

### 7. AI opponents and ranked play

AI opponents and ranked matches were added as features of the digital game. Codex assisted with implementation, debugging, and iteration. The production AI and ranked systems are not included in this repository.

### 8. Tutorials and accessibility

A beginner tutorial, an English and Traditional Chinese interface, and ongoing UI improvements help new players learn the rules and get into a match more easily.

### 9. Iteration and balancing

The game is still in development. Codex helps with implementation, code analysis, debugging, regression fixes, refactoring, UI changes, and system improvements. I remain responsible for the original game design, rules, balance decisions, gameplay direction, and feature requirements.

### 10. Major feature milestones — 2026

The following is a brief selection of major development milestones based on the production repository's Git history. These months reflect recorded development work, not necessarily public release dates.

- **August | Online multiplayer prototype:** Published the first online prototype, developed synchronized multiplayer turns and game state, and added CPU opponents.
- **August | Master AI V2:** Developed more advanced search, position evaluation, and strategic analysis, with continued work on defense, risk assessment, and computing efficiency.
- **August–September | Presentation and localization:** Added interactive battle effects, Traditional Chinese support, background music, tutorials, and clearer gameplay guidance.
- **September | Player colors and Color Lab:** Expanded customizable player tile colors and patterns with editing, previews, and shareable designs.
- **September | Match replays:** Extended match replay features with record import and export for reviewing and sharing games.
- **October | Knockout tournaments:** Introduced tournament lobbies, brackets, rounds, and match advancement.
- **October | Player History and seasonal badges:** Added a player history page displaying seasonal and event badge records.
- **October | Opening draw and Ranked format:** Introduced a player-interactive starting-order draw, switched Ranked matches to a single round, and refined draw settlement.
- **October | MFM Desktop:** Released a portable Windows x64 client built using Microsoft Edge WebView2.

### 11. Current version

Monster Fusion Masters is now a free-to-play, browser-based online competitive strategy game with real-time PvP, AI opponents, and ranked play. Development is ongoing.

## About this repository

This repository contains selected showcase materials and non-sensitive code examples only.

The complete production source code, game AI, ranking logic, and other core systems are not publicly distributed.

The examples in this folder are small, general-purpose demonstrations. They are not copies of the production implementation and do not include the game's rules, AI, scoring, matchmaking, security, or server systems.

## Showcase assets

The `assets/` folder contains the showcase cover and the four interface screenshots used above. A photo of the original physical edition can be added later.


