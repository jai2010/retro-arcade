# Offline Arcade

Ten self-contained retro games. Each game is one HTML file with inline CSS and JavaScript.

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
  header. Keyboard controls and button pads still work on larger screens.
- The home page uses `thumbs/*.png`, cropped from the supplied illustration grid.
  They are local files; nothing is fetched over the network.
- No external fonts, images, audio, libraries or network calls are used.
