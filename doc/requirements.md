# Requirements

The requirements are formulated in Gherkin-style entries,
with each requirement expressed as:

Feature: ...
Scenario: ...
Given ...
When ...
Then ...

## Gherkin Feature Blocks

Feature: Word Code Breaker as deductive word game
Scenario: Player solves a hidden 5-letter word by deduction
Given a new game session is running
When the player submits valid 5-letter attempts
Then the game evaluates feedback and allows deduction until solved or attempts are exhausted

Feature: Language selection between German and English
Scenario: Player chooses game language in options
Given the options view is open
When the player selects German or English and confirms options
Then the game restarts with the selected language configuration

Feature: German dictionary source
Scenario: Game validates German attempts against German word list
Given language is set to German
When the player submits a 5-letter attempt
Then the attempt is validated against ./data/de_5_letters.py source equivalent data

Feature: English dictionary source
Scenario: Game validates English attempts against English word list
Given language is set to English
When the player submits a 5-letter attempt
Then the attempt is validated against ./data/en_5_letters.py source equivalent data

Feature: On-screen keyboard adapts to selected language
Scenario: Keyboard layout switches with language
Given a game is active
When language is German
Then the keyboard shows the German alphabet layout including language-specific keys

Feature: Keyboard contains letter keys plus correction and submit controls
Scenario: Player uses keyboard controls for input flow
Given the on-screen keyboard is visible
When the player interacts with keys
Then letter keys append letters, backspace removes the last letter, and enter submits a full attempt

Feature: German keyboard supports umlauts and sharp s
Scenario: German key inventory includes special letters
Given language is German
When the keyboard is rendered
Then keys for umlauts and letter ß are available

Feature: Board tile rendering keeps ß lower case
Scenario: Lower-case exception for sharp s on board
Given an attempt or secret contains ß
When tiles are rendered on the game board
Then ß is shown lower case while all other letters are shown upper case

Feature: Cursor indicates current typing position
Scenario: Board shows current insertion slot during typing
Given the player is entering a 5-letter attempt
When fewer than 5 letters are currently entered
Then the next tile position is visibly marked as the cursor

Feature: Attempt must exist in selected language dictionary
Scenario: Invalid word submission is rejected
Given the player entered 5 letters
When the submitted word is not in the selected language dictionary
Then the attempt is rejected and the game state for attempts/history is not advanced

Feature: Every attempt is a valid 5-letter word
Scenario: Valid submission advances the game
Given the player entered exactly 5 letters and the word exists in dictionary
When the player submits the attempt
Then the attempt is accepted and evaluated against the secret word

Feature: Configurable attempt limit
Scenario: Player selects maximum attempts option
Given the options view is open
When the player selects 6, 8, 10, or unlimited attempts and confirms
Then the new game uses the selected attempt limit

Feature: Direct feedback colors board tiles by match quality
Scenario: Direct feedback is enabled for a submitted attempt
Given direct feedback option is enabled
When a valid attempt is submitted
Then exact letters are green, misplaced included letters are yellow, and non-included letters are white

Feature: Indirect feedback shows exact and misplaced sums
Scenario: Indirect feedback is enabled for a submitted attempt
Given indirect feedback option is enabled
When a valid attempt is submitted
Then the UI displays the numerical sum of exact placements followed by the sum of misplaced included placements

Feature: Feedback mode selectable as Direct, Indirect, or Both
Scenario: Player selects feedback mode via radio buttons
Given the options view is open
When the player selects one of the three feedback modes (Direct, Indirect, Both)
Then the selected mode is applied exclusively, with Both as the default

Feature: Keyboard colors reflect used-letter and match status after submissions
Scenario: Keyboard updates letter key backgrounds from submitted history
Given at least one valid attempt has been submitted
When keyboard status is recalculated
Then each letter key background follows the defined rule set for unused, used, absent, present, and correct states

Feature: Unused letter keys are white
Scenario: Letter has not appeared in any submitted attempt
Given a letter key has never been used in submitted attempts
When keyboard colors are rendered
Then that key background is white

Feature: Used letter keys are light grey in indirect-only mode
Scenario: Direct feedback is disabled and indirect feedback is enabled
Given a letter key has been used in any previous submitted attempt
When keyboard colors are rendered
Then that key background is light grey

Feature: Used absent letters are light grey in direct mode
Scenario: Direct feedback is enabled and letter is not in secret
Given a used letter has only absent results in submitted attempts
When keyboard colors are rendered
Then that key background is light grey

Feature: Used misplaced letters are yellow in direct mode
Scenario: Direct feedback is enabled and letter is included but never exact
Given a used letter has at least one misplaced result and no exact result
When keyboard colors are rendered
Then that key background is yellow

Feature: Used exact letters are green in direct mode
Scenario: Direct feedback is enabled and letter was exact at least once
Given a used letter has at least one exact result
When keyboard colors are rendered
Then that key background is green

Feature: Keyboard status resets on restart and language change
Scenario: New game starts with clean key colors
Given a previous game has recorded used-letter statuses
When the player starts a new game or changes language and confirms options
Then keyboard key statuses are reset to initial unused state

Feature: Invalid dictionary submissions do not color keyboard
Scenario: Rejected word does not affect key status
Given the player submits a 5-letter word not found in dictionary
When submission is rejected as invalid
Then keyboard color status remains unchanged

Feature: Only submitted attempts affect keyboard coloring
Scenario: Typing before enter does not mark key as used
Given the player is typing letters in the current row without submission
When keyboard colors are rendered before enter
Then typed but not submitted letters do not change used-letter key coloring

Feature: Special keys never use feedback colors
Scenario: Enter and backspace keep dedicated appearance
Given the on-screen keyboard is displayed
When feedback coloring is applied to letter keys
Then Enter and Backspace keys do not receive feedback colors

Feature: Special keys are always light blue
Scenario: Control keys maintain constant background style
Given the on-screen keyboard is displayed
When key styles are rendered in any game state
Then Enter and Backspace keys use a light blue background

Feature: Timer starts with first submitted attempt
Scenario: Elapsed game time begins on first valid submission
Given a game is in initial state with no submitted attempts
When the first valid attempt is submitted
Then the game timer starts

Feature: Timer stops when secret is found
Scenario: Final duration is frozen at win state
Given the timer is running during gameplay
When the secret word is found
Then the timer stops and final duration is shown

Feature: Highscores and options persist across sessions
Scenario: Stored user state is restored on reload
Given a user previously changed options or recorded highscores
When the application is opened again
Then options and highscores are restored from persistent storage

Feature: Highscore ranking prioritizes attempts then time
Scenario: Better score wins with fewer attempts or faster time tie-break
Given two completed winning results for the same profile
When highscores are compared
Then lower attempt count ranks higher, and for equal attempts lower solve time ranks higher

Feature: Highscores are tracked by period buckets
Scenario: Daily, weekly, and monthly leader values are available
Given completed winning games exist
When highscores are displayed
Then separate best values are shown for day, week, and month periods
