# Word Code Breaker

## Abstract

Word Code Breaker is a deductive word guessing game where the goal is to discover a hidden
5-letter word within a limited number of attempts. After each valid guess the game provides
feedback about which letters are in the correct position and which are present but misplaced.

## Game Options

In the options menu the game configuration can be changed:

- **Language**: English or German. The word list and on-screen keyboard adapt to the chosen language.
- **Maximum attempts**: 6, 8, 10, or unlimited.
- **Direct Feedback**: when enabled, each tile in a submitted guess is colored to show letter match quality.
- **Indirect Feedback**: when enabled, each submitted guess shows two badges with the count of exact and misplaced letters.

The feedback mode is selected in the options menu as one of three choices: **Direct Feedback**, **Indirect Feedback**, or **Both** (the default).

## Input and Keyboard

The player enters a guess using the on-screen keyboard or the physical keyboard.
An edit cursor on the game board shows the current input position.

### On-screen keyboard layout

- **English**: QWERTY rows, letters A–Z only.
- **German**: QWERTZ rows, letters A–Z plus umlauts Ä, Ö, Ü and the letter ß.

Control keys:

- **Enter** (↵): submit the current 5-letter attempt.
- **Backspace** (⌫): remove the last typed letter.

Control keys always show a light blue background and never receive feedback coloring.

## Game Rules

- Each attempt must be a valid word from the selected language dictionary.
- An attempt that is not found in the dictionary is rejected: the current row shakes and no history entry is recorded.
- Only successfully submitted attempts advance the game.

### Letter tile rendering

- All letters are shown upper case except **ß**, which is always shown lower case.

### Direct Feedback — tile colors

| Situation | Tile color |
| --- | --- |
| Letter is at the correct position | Green |
| Letter is in the word but misplaced | Yellow |
| Letter is not in the word | White |

Direct Feedback is only applied when the direct feedback option is enabled.

### Indirect Feedback — row badges

When indirect feedback is enabled, each submitted row displays:

- **`exact n`** — count of letters in the correct position (green badge, white text)
- **`misplaced n`** — count of letters included in the word but misplaced (amber badge, white text)

## On-screen Keyboard Coloring

After each valid submission the key backgrounds reflect the best result that letter has received across all submitted attempts.

| Situation | Key color |
| --- | --- |
| Letter not yet used in any submitted attempt | White |
| Letter used; direct feedback disabled | Light grey |
| Letter used; direct feedback enabled; letter not in secret | Light grey |
| Letter used; direct feedback enabled; letter misplaced, never exact | Yellow |
| Letter used; direct feedback enabled; letter placed exactly at least once | Green |

Priority order: green > yellow > grey > white.

Keys are colored only from successfully submitted attempts. Letters currently typed but not yet submitted do not affect key colors. Key colors reset when a new game is started or the language is changed.

## Winning and Losing

When the player finds the secret word within the configured attempt limit:

- a success message is shown
- the game board plays a celebration animation
- the elapsed time is recorded and a highscore entry may be saved

When the attempt limit is reached without finding the word:

- a status message explains the game is over
- the secret word is revealed
- the final attempt row plays a tilt animation

## Timer

The game timer starts when the first attempt is submitted. It stops and shows the final
elapsed time when the secret word is found. The timer continues to count if the game is lost.

## Highscores

A persistent highscore system tracks attempt count and elapsed solve time (from first
submission to the winning submission) for three rolling periods: **day**, **week**, and **month**.

Ranking: lower attempt count wins. Equal attempt counts are broken by shorter elapsed time.

Highscore entries reset automatically when their period ends. They can also be reset manually per period from the options menu.

Current highscores for the active profile are shown in a sidebar during gameplay.
