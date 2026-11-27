# Offline Arcade

Twenty-two self-contained retro games. Each game is one HTML file with inline CSS and JavaScript.

## Play

On a computer, open `index.html` in a browser. On a phone, copy this whole folder
to the device, then open `index.html` from the Files app or a local file browser.
No internet connection is required.

## Games

| Game | File | Input |
|---|---|---|
| Tetris | `tetris/index.html` | Keyboard + touch buttons |
| Snake | `snake/index.html` | Swipe on board, arrow buttons, arrow keys |
| Breakout | `breakout/index.html` | Drag paddle, tap to launch |
| Space Invaders | `invaders/index.html` | Drag ship, fire button, arrow keys |
| Asteroids | `asteroids/index.html` | Rotate / thrust / fire buttons, keyboard |
| Pong | `pong/index.html` | Drag paddle, up/down buttons, arrow keys |
| Frogger | `frogger/index.html` | Tap or swipe to hop, arrow keys |
| 2048 | `2048/index.html` | Swipe, arrow keys, touch buttons |
| Simon | `simon/index.html` | Tap pads, keys 1-4 |
| Pac-Man | `pacman/index.html` | Swipe, arrow keys, touch buttons |
| Sky Hop | `skyhop/index.html` | Tap to flap (keyboard on desktop) |
| Whack-a-Mole | `whackamole/index.html` | Tap a mole |
| Memory | `memory/index.html` | Tap cards to flip |
| 15 Puzzle | `fifteen/index.html` | Tap a tile to slide it |
| Minesweeper | `minesweeper/index.html` | Tap to reveal, long-press to flag |
| Connect Four | `connect4/index.html` | Tap a column to drop a disc |
| Sokoban | `sokoban/index.html` | Swipe or tap a neighbour to move |
| Lunar Lander | `lunarlander/index.html` | Tap/hold to thrust, drag to steer |
| Missile Command | `missilecommand/index.html` | Tap to intercept |
| Road Rider | `roadrider/index.html` | Swipe lanes, tap to kick |
| Rally Run | `rallyrun/index.html` | Drag to steer, tap to boost |
| Highway Hero | `highwayhero/index.html` | Swipe lanes, tap to sprint |

## Notes

- Every game stores its best score in the browser's `localStorage`, keyed by game.
  If a browser blocks storage for local files, the score simply stays in memory
  for that session.
- All games use the same visual system: paper ground, ink text, coral accent,
  teal secondary, system font, rounded surfaces, and visible focus states.
- Every game uses the same two-column layout: playfield on the left, controls
  and instructions on the right. On narrow screens the two columns stack.
- On phones (including landscape), keyboard input and the on-screen button pads are
  hidden; play with swipe, drag and tap on the board. Pause and New game stay in the
  header. The board is sized to the viewport in portrait and landscape. A short controls
  tooltip appears on phones and closes with its × button; it is shown again on the next
  visit. Keyboard controls and button pads still work on larger screens.
- The home page uses local thumbnails in `img/`: PNGs cropped from the supplied
  illustration grid for the original games, and matching SVG thumbnails for the
  newer ones. Nothing is fetched over the network.
- No external fonts, images, audio, libraries or network calls are used.
