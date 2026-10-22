# Card Clash — Android-Hosted Multiplayer Card Game

Build a complete, mobile-first **UNO-inspired card game**. One Android phone hosts the game; 1–3 other players join from their phone browsers over the **same Wi-Fi**. No paid hosting, cloud server, accounts, or AI. Use original visuals and call it UNO-inspired; do not use unlicensed UNO branding/artwork.

## Architecture
- **Host:** Android app written in Java. It starts/stops a local HTTP + WebSocket server.
- **Game engine:** plain Java classes, separate from Android UI and browser code.
- **Server libraries:** use compatible lightweight embedded HTTP and WebSocket libraries; explain the chosen dependencies and versions. Do not assume a browser can run a Java server.
- **Clients:** HTML, CSS, and vanilla JavaScript served by the host; JSON messages over WebSockets.
- **Build:** Gradle, with setup instructions and a buildable debug APK.

## Player Flow
1. Host taps **Start Hosting**; app shows server status, local IP:port, room code, and QR code.
2. Host sets nickname, 2–4 player limit, and rules.
3. Friends on the same Wi-Fi scan the QR code or enter the host URL and room code in a browser.
4. Players enter nicknames and wait in a lobby. Only the host can change room settings or start the game; require at least two players.
5. Server deals cards and controls turns. Browsers show each player's private hand and shared public state.
6. Show round/match results and let the host start another round.

## Game Rules
- Four colors: red, blue, green, yellow; numbered cards 0–9.
- Actions: Skip, Reverse, Draw Two, Wild, Wild Draw Four.
- Shuffle fairly and deal seven cards per player. Validate legal color/symbol matches, turn order, two-player Reverse behavior, draw-pile reshuffling, Wild color choice, UNO call/penalty, round victory, and optional cumulative scoring.
- Stacking is off by default. Document rule variations and edge cases; never silently mix rule sets.
- No bots or AI. All players are human.

## UI / UX
Design a polished, responsive interface for portrait phones first, with landscape/desktop support:
- Home: **Create Room**, **Join Room**, Rules, Settings.
- Host setup and join-by-IP/room-code screens.
- Lobby: room code, QR/invite URL, player list, connection/ready status, host-only Start.
- Game table: opponent names/card counts, turn indicator, active color, discard pile, draw pile, direction, recent move, deck count.
- Player hand at bottom: tappable scrollable cards, playable-card highlights, clear selected state, Draw and UNO buttons.
- Wild color picker, menu, result screens, reconnecting/connection-lost states.
- Use a dark table theme, bright card colors, readable symbols, large touch targets, subtle lightweight animations, high contrast, and reduced-motion support. Do not depend on hover.

## Networking and Fairness
- The Java host server is authoritative for rooms, deck, hands, moves, turns, rules, and scores.
- Send each player **only their own cards** plus public state. Never send hidden opponent card identities.
- Validate room membership, session, turn, card ownership, legal moves, selected color, and every client message on the server. Ignore client-supplied scores/winners.
- Use WebSockets for join/leave, ready/start, play/draw, color choice, UNO call, state updates, errors, and ping/pong.
- Prevent duplicate actions/races; validate JSON and limit message size/rate.
- Handle disconnects and allow secure-token reconnection during a grace period. If the host stops, show a clear error; explain that a hosted match may end.
- Keep the server local-network-only by default. Never expose it to the public internet automatically.

## Android Host App
Include Start/Stop Server, status, IP/port, room/player status, copy URL, QR code, and diagnostics. Handle port conflicts, Wi-Fi changes, app backgrounding, and startup failure. Use a foreground service/notification if required for reliable hosting, following Android lifecycle restrictions.

## Settings and Privacy
Host rules: player limit, starting hand size, scoring target, draw rules, stacking, UNO penalty, optional timeout (off by default). Client options: sound, animation level, card size, reduced motion, vibration where supported. Keep stats locally. No tracking, analytics, cloud database, or account system.

## Deliverables
Provide a complete project—not mockups or pseudocode—with Android host, Java engine, embedded HTTP/WebSocket server, browser UI, Gradle files, dependency versions, unit tests, README, troubleshooting, and APK build/install instructions.

## Build in Stages
1. Implement and test Java rules.
2. Add the Android-hosted HTTP/WebSocket server.
3. Build browser screens and room join/creation.
4. Synchronize public state and private hands.
5. Implement special cards, UNO, scoring, and results.
6. Add disconnect/reconnect and polish.
7. Test with at least two real phones on the same Wi-Fi.

After each stage, list files changed, commands to run, and tests performed. Do not claim a feature is complete unless verified.

## Acceptance Criteria
At least two phones can play through browsers on the same Wi-Fi; one Android phone hosts locally; no paid hosting is needed; there is no AI; hidden hands remain private; server validates every move; UI works on mobile; and the project builds from the supplied instructions. Prioritize a working end-to-end game over extras.