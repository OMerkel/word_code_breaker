# Word Code Breaker

Word Code Breaker is a browser-based deductive word guessing game.
Guess the hidden 5-letter word within the attempt limit using an English or German
dictionary and optional direct (colour) and indirect (count) feedback.

## Play Online

- [Start game now...](https://omerkel.github.io/word_code_breaker/javascript/html5/src/)

## Features

- **Languages**: English (QWERTY, A–Z) and German (QWERTZ, A–Z + Ä, Ö, Ü, ß)
- **Direct feedback**: green = correct position · yellow = wrong position · grey = absent
- **Indirect feedback**: `exact n` + `misplaced n` badges per row
- Feedback mode selectable: Direct only, Indirect only, or Both (default)
- **Attempt limit**: 6, 8, 10, or unlimited
- **Game timer**: starts on first submission, stops when the word is found
- **Persistent highscores**: day / week / month, ranked by attempts then solve time
- **PWA**: offline-capable via service worker; word lists are pre-cached
- Physical keyboard fully supported including German special characters

## Repository structure

```text
word_code_breaker/
├── data/                        # Source word lists (one word per line, UTF-8)
│   ├── en_5_letters.txt         #   1 192 English 5-letter words
│   └── de_5_letters.txt         #   1 482 German 5-letter words (incl. ß, umlauts)
├── doc/                         # Project documentation
│   ├── requirements.md          #   Gherkin-style feature specifications
│   ├── rules.md                 #   Human-readable game rules
│   ├── i18n.md                  #   Internationalisation and dictionary guide
│   └── software_architecture.md #   Architecture, message flows, Mermaid diagrams
├── javascript/html5/src/        # Web application source
│   ├── index.html
│   ├── css/index.css
│   ├── js/
│   │   ├── board.js             #   Pure game logic (immutable state transitions)
│   │   ├── common.js            #   Settings, keyboard layouts, utilities
│   │   ├── controller.js        #   Web Worker: word list loading + validation
│   │   ├── hmi.js               #   UI orchestration, i18n, persistence
│   │   ├── renderer.js          #   DOM rendering (tiles, keyboard)
│   │   ├── store.js             #   Reactive UI state store
│   │   └── sw.js                #   Service worker (offline caching)
│   ├── data/                    #   Word list copies served to the browser
│   ├── tests/
│   │   ├── unit/                #   Vitest unit tests
│   │   └── e2e/                 #   Playwright end-to-end tests
│   ├── manifest.json            #   PWA manifest
│   ├── manifest.webapp          #   Firefox OS / hosted webapp manifest
│   ├── manifest_hosted.webapp
│   └── package.json
└── javascript/html5/config.xml  # Cordova / PhoneGap build config
```

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (bundled with Node.js)

### Install dependencies

```powershell
cd javascript/html5/src
npm install
```

### Run locally

```powershell
node tests/server.js
```

Then open <http://localhost:4173> in your browser.

## Testing

All test commands are run from `javascript/html5/src/`.

### Unit tests

```powershell
npm test
```

Runs the Vitest suite covering `board.js`, `common.js`, `store.js`, and `controller.js`.

### Unit test coverage

```powershell
npm run test:coverage
```

Generates a text summary and an HTML report under `coverage/`.
Enforced thresholds (build fails below these):

| Metric | Threshold |
| --- | --- |
| Statements | ≥ 98 % |
| Branches | ≥ 98 % |
| Functions | ≥ 98 % |
| Lines | ≥ 98 % |

### End-to-end tests

```powershell
npm run test:e2e
```

Requires the local dev server to be running (`node tests/server.js`).
Uses Playwright against <http://localhost:4173>.

### All tests at once

```powershell
npm run test:all
```

## Documentation

| File | Content |
| --- | --- |
| [doc/rules.md](doc/rules.md) | Game rules and mechanics |
| [doc/requirements.md](doc/requirements.md) | Gherkin feature specifications |
| [doc/i18n.md](doc/i18n.md) | Translation keys, dictionary format, adding a language |
| [doc/software_architecture.md](doc/software_architecture.md) | Architecture diagrams, message flows, state charts |
| [javascript/html5/src/README.md](javascript/html5/src/README.md) | Implementation notes for the web app |

## License

Source code is released under the [MIT License](LICENSE).
Copyright © 2026 Oliver Merkel.
