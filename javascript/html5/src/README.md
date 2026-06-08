# Word Code Breaker

Word Code Breaker is a browser-first deductive word guessing game.
Guess the hidden 5-letter word within the attempt limit.
Powered by EN and DE dictionaries with optional direct (color) and indirect (count) feedback.

## Feature List

- Language: **English** (QWERTY, A–Z) and **German** (QWERTZ, A–Z + **Ä, Ö, Ü**)
- Guess validation against the language-specific word dictionary
- **Direct Feedback**: green = correct position, yellow = wrong position, grey = not in word
- **Indirect Feedback**: `exact n` + `misplaced n` badges per submitted row
- Feedback mode selectable: Direct, Indirect, or Both (default)
- Both feedback modes can be active simultaneously or independently
- Maximum attempts: **6**, **8**, **10**, or **unlimited**
- Game timer: starts on first letter submitted, stops when the word is found
- Persistent highscores per day, week, and month (ranked by attempts, then time)
- Highscore reset per period
- Six-section main navigation: game board, rules, options, about
- PWA manifests, service worker for offline startup (word lists cached), and Cordova config

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Install

```powershell
npm install
```

### Run locally

```powershell
node tests/server.js
```

Open <http://localhost:4173>.

## Test Commands

Unit tests:

```powershell
npm test
```

Unit coverage:

```powershell
npm run test:coverage
```

E2E tests:

```powershell
npm run test:e2e
```

All tests:

```powershell
npm run test:all
```

## Coverage

Vitest coverage is enforced at:

- Statements >= 98
- Branches >= 98
- Functions >= 98
- Lines >= 98

## Architecture

See `doc/software_architecture.md`.

## Implementation Notes

- Pure word game rule transitions live in `js/board.js` (`scoreWordGuess`, `applyAction`).
- EN/DE keyboard layouts (QWERTY/QWERTZ with Ä, Ö, Ü) are defined in `js/common.js`.
- Word list loading and dictionary validation live in `js/controller.js` (web worker).
- UI state coordination lives in `js/store.js` and `js/hmi.js`.
- Rendering (letter tiles, keyboard, feedback) is isolated in `js/renderer.js`.
- Word lists: `data/en_5_letters.txt` (1 192 words) and `data/de_5_letters.txt` (1 482 words).

## License

Source code is MIT-licensed.
