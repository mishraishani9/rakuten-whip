# IP Mastery Game

LOVABLE MASTER BUILD PROMPT — IP QUIZ / BUSINESS OF IP GAME

1. PRODUCT NAME

Build a polished web application called:

Business of IP Game

Short product label in the UI:

IP Quiz

The application is an offline, presenter-controlled, multiplayer board game designed for IP awareness workshops.

The game focuses on:

Intellectual Property

Patents

Trademarks

Patentability

Prior Art

Inventorship

Trade Secrets

Copyright

Standards / SEPs / FRAND

General IP awareness

The application should feel like a polished corporate workshop/game product rather than a generic quiz website.

2. IMPORTANT IMPLEMENTATION CONSTRAINT

I am using a free Lovable account.

Therefore:

Build the application in a way that minimizes unnecessary implementation complexity.

Do NOT add unnecessary third-party integrations.

Do NOT build online multiplayer at this stage.

Do NOT build authentication unless absolutely required by the chosen Lovable backend.

Do NOT build a complex real-time synchronization architecture.

The game is currently an offline, presenter-controlled game running on one screen/device.

The presenter controls player selection, dice values, movement, answers, timers, pauses, and game flow.

Game configuration and game-history/analytics data should persist in the backend.

Individual live-game state can primarily be managed in frontend state, with important aggregated game results persisted when the game is ended/saved.

Keep the architecture modular so online multiplayer can be added later.

The priority is:

Build a complete, polished, functional MVP rather than an over-engineered architecture.

3. DATA SOURCE

The application will use a CSV question bank containing approximately 1,550 questions initially:

50 Golden questions

500 Easy generated questions

500 Medium generated questions

500 Hard generated questions

The CSV contains these columns:

Record_Type
Record_ID
Difficulty
Theme
Question
Option_A
Option_B
Option_C
Option_D
Correct_Option
Correct_Answer


The initial CSV will be supplied to the application.

The application must treat this CSV as the source question bank.

IMPORTANT:

Do NOT hard-code individual questions into the UI.

Questions must be loaded into a question-bank data structure.

The architecture must support future bulk CSV uploads using exactly the same structure.

4. QUESTION BANK REQUIREMENTS

Every question has:

Record_Type

Record_ID

Difficulty

Theme

Question

Option_A

Option_B

Option_C

Option_D

Correct_Option

Correct_Answer

Example:

Record_Type: Generated
Record_ID: E0001
Difficulty: Easy
Theme: IP fundamentals
Question: What does IP stand for?
Option_A: Intellectual Property
Option_B: International Patent
Option_C: Innovation Process
Option_D: Industrial Product
Correct_Option: A
Correct_Answer: Intellectual Property


The application should validate uploaded CSV files.

Minimum required columns:

Record_ID
Difficulty
Theme
Question
Option_A
Option_B
Option_C
Option_D
Correct_Option
Correct_Answer


If mandatory columns are missing:

Reject the upload.

Show a clear validation message.

Do not partially import the file.

If duplicate Record_IDs exist:

Detect them.

Show the user the number of duplicates.

Do not create duplicate question records.

If a CSV contains invalid difficulty values, allow only:

Easy
Medium
Hard


If Correct_Option is not A/B/C/D, reject the affected row or reject the file with a clear error.

5. QUESTION SELECTION LOGIC

This is extremely important.

The question bank contains approximately 1,550 questions.

Questions must NEVER repeat during the same gameplay session unless the presenter explicitly requests a reset/restart of the game.

When a new game is created:

usedQuestionIds = []


When a player lands on a question square:

Identify the Theme associated with that board position.

Identify the Difficulty associated with that board position.

Filter the question bank by that Theme + Difficulty.

Remove every question whose Record_ID exists in usedQuestionIds.

Randomly select one remaining question.

Add the selected Record_ID to usedQuestionIds.

Display the question.

Example:

Board position:

Theme = Trademark
Difficulty = Medium


The system must select:

Difficulty = Medium
Theme = Trademark


and exclude all previously used questions from the current game.

IMPORTANT:

The question selection must be random.

But randomness must NEVER override the Theme + Difficulty requirement.

If no unused question remains for that exact Theme + Difficulty combination:

Show:

"No unused questions remain for this category."

Then give the presenter controlled options:

Choose a question from another difficulty of the same theme

Choose a question from another theme

Skip question

Reset used questions

Do not automatically repeat a question without presenter approval.

6. BOARD GAME CONCEPT

The main gameplay screen should look like a premium board game.

Use a rectangular/square board layout similar in overall board-game structure to classic property board games, but do not copy Monopoly branding, artwork, names, or visual assets.

The board should contain four special corner positions:

START

CLUB

BAR

JAIL

The board should contain approximately 24 total perimeter positions.

Use:

4 corner positions

approximately 20 intermediate playing positions

Each side should have at least approximately 6 playable positions.

The exact layout can be implemented as a CSS Grid or another stable responsive layout.

Do NOT use canvas unless necessary.

Prefer standard React components + CSS for easier maintainability.

7. BOARD POSITION TYPES

Each perimeter position should have one of these types:

A. QUESTION

A normal question square.

Each question square has:

Theme
Difficulty


Example:

PATENT
EASY


or:

TRADEMARK
MEDIUM


The square itself should visually display the theme and difficulty.

B. BONUS

Bonus squares provide an immediate movement advantage.

Example:

BONUS
+2


When a player lands there:

"BONUS! Move forward 2 spaces."

The pawn automatically moves forward by the specified number of positions.

Bonus movement should be recorded for analytics.

Create approximately:

2–3 Bonus squares

C. QUESTION MARK / EVENT

These are special event squares.

Create approximately:

3–4 Question Mark squares

The outcome depends on the dice value that caused the player to land on the square.

For example:

Dice = 1 → special event A
Dice = 2 → special event B
Dice = 3 → JAIL
Dice = 4 → CLUB
Dice = 5 → BAR
Dice = 6 → special event C


The six mappings should be configurable in one central game-rules configuration rather than hard-coded throughout the UI.

Randomly assign the six event outcomes when the game configuration is created, OR provide a default configuration.

The presenter should see the result clearly.

8. SPECIAL CORNER RULES

START

Start position.

Players begin here.

Passing Start means the player has completed one full circuit.

The game objective is to complete a full circuit and return to Start.

CLUB

A player landing in Club must miss one turn.

Display:

"You are in CLUB. Miss your next turn."

Store:

clubVisits += 1
missedTurns += 1


BAR

A player landing in Bar must miss two turns.

Display:

"You are in BAR. Miss your next two turns."

Store:

barVisits += 1
missedTurns += 2


JAIL

A player landing in Jail becomes temporarily locked.

The player must roll either:

1 OR 6


to escape.

The presenter manually enters the offline dice result.

If the result is 1 or 6:

"You escaped Jail!"

Otherwise:

"Still in Jail."

The exact Jail release rule should be configurable.

9. BOARD POSITION CONFIGURATION

Do not hard-code board behavior inside visual components.

Create a board configuration such as:

const BOARD_POSITIONS = [
  {
    position: 0,
    type: "start",
    label: "START"
  },
  {
    position: 1,
    type: "question",
    theme: "Patent",
    difficulty: "Easy"
  },
  ...
]


Every question position must contain:

position
type
theme
difficulty


Bonus positions:

position
type
bonusMove


Event positions:

position
type
event


Corner positions:

position
type
label


Keep this configuration centralized so I can easily change the board later without rewriting gameplay logic.

10. PLAYER SETUP

Landing page should have:

BUSINESS OF IP GAME

Subtitle:

Test your IP knowledge. Build your strategy. Win the board.

Primary button:

CREATE NEW GAME

Secondary button:

LOAD PREVIOUS GAME

Additional button:

QUESTION BANK

Additional button:

ANALYTICS

11. CREATE NEW GAME FLOW

When the presenter clicks:

CREATE NEW GAME

Show a configuration screen.

Fields:

Game Name

Default:

Business of IP Game - [current date/time]


Allow editing.

Number of Players

Allow:

2
3
4
5
6
7
8
9
10


The initial implementation should support up to 10 players.

After selecting number of players, dynamically create player fields.

For each player:

Player Number
Player Name
Pawn Color


Pawn colors should automatically be assigned.

Example:

Player 1
Player 2
Player 3
...


Each pawn should have a visible sequence number:

1
2
3
...


and the player's name should appear as a small label above/attached to the pawn.

Allow the presenter to edit player names.

Button:

START GAME

12. PLAYER PAWNS

Every player gets a visually distinct pawn.

Pawns should:

Have different colors

Have a sequence number

Display the player's name

Be clearly visible on the board

Animate when moving

Be visually polished

Be distinguishable even when several pawns occupy the same square

If multiple players occupy the same square:

offset pawns slightly

do not completely overlap them

13. GAMEPLAY SCREEN LAYOUT

The gameplay screen should have three major regions.

LEFT / MAIN REGION

Large game board.

RIGHT REGION

Presenter control panel.

LOWER REGION

Current player / question / game information depending on screen size.

The UI must be responsive.

For desktop workshop presentation, prioritize a large board and large readable controls.

14. PRESENTER CONTROL PANEL

The presenter controls the entire game.

Display:

Current Player

Example:

CURRENT PLAYER
Player 3 — Rohan


Then:

Dice Input

Large input:

DICE ROLL
[ 3 ]


Buttons:

MOVE


The presenter enters the physical/offline dice result.

Do NOT implement a random dice generator as the primary mechanism.

The real dice is assumed to be rolled physically.

Optional:

ROLL DICE visual animation may be added later, but it is not required for MVP.

15. TURN FLOW

Normal turn:

Presenter selects current player.

Physical dice is rolled offline.

Presenter enters dice value.

Click MOVE.

Pawn moves the specified number of positions.

Landing position is determined.

If Question square:

determine Theme + Difficulty

select unused random question

display question

start 15-second timer

Player answers.

Presenter selects the answer.

Answer becomes orange immediately.

System reveals correct/incorrect state.

Correct answer becomes green.

Incorrect selected answer becomes red.

Question is marked used.

Turn logic is applied.

16. CORRECT ANSWER RULE

If player answers correctly:

Current player retains the turn.


Display:

Correct! You get another turn.

The presenter can continue with the same player.

The presenter enters the next physical dice value.

The pawn moves again.

A new question is generated based on the landing square.

IMPORTANT:

Correct answer does NOT automatically give another movement.

The presenter still manually enters the next dice value.

17. WRONG ANSWER RULE

If the player answers incorrectly:

Turn passes to next eligible player.


Display:

Incorrect. Turn passes to the next player.

The presenter selects/receives the next player's turn.

The next player rolls the physical die.

Presenter enters the dice value.

18. TIMEOUT RULE

Every question has a:

15-second timer

Display prominently.

Example:

00:15


Countdown:

15
14
13
...
1
0


When timer reaches zero:

Automatically mark the question as unanswered/wrong.

Lock answer selection.

Reveal correct answer.

Turn passes to next player.

Treat timeout exactly like an incorrect answer for turn-flow purposes.

19. TIMER PAUSE

The presenter must be able to pause the entire game.

Button:

PAUSE GAME

When paused:

board stops

timer stops

movement stops

question interaction stops

all gameplay actions are disabled except resume/admin controls

Show a prominent overlay:

GAME PAUSED

Button:

RESUME GAME

The question timer must resume from exactly where it stopped.

20. QUESTION SCREEN

Questions should be displayed in a premium quiz-show style.

Do NOT copy any specific television show's exact design.

Use the general concept:

large question

four large answer buttons

high contrast

clean typography

strong visual hierarchy

Display:

PATENT
MEDIUM


Then:

Question text


Then four large buttons:

A. Option
B. Option
C. Option
D. Option


21. ANSWER ANIMATION

When presenter selects an option:

First:

Selected answer becomes:

ORANGE

Then after a short delay:

Correct answer becomes:

GREEN

If the selected answer was wrong:

Selected answer becomes:

RED

The correct answer becomes:

GREEN

Use a short polished animation/blink effect.

After reveal:

Display:

CORRECT!


or:

INCORRECT


Then show:

Correct Answer: B


The presenter controls when to continue if necessary.

22. PRESENTER ADMIN CONTROLS

The presenter should have an expandable:

GAME CONTROLS

section.

Include:

Pause Game

Pause/resume entire game.

Different Question

Allow presenter to discard the current question and request another unused question with the same Theme + Difficulty.

The discarded question should NOT be marked as used unless the presenter confirms it was actually shown/used.

Skip Question

Skip the current question.

Manual Move

Allow presenter to select any player and manually move them to any board position.

This should be clearly marked as an administrative action.

Rename Player

Allow presenter to rename a player during gameplay.

Rename Game

Allow presenter to rename the game during gameplay.

Rollback

Allow rollback of the last 5 movement actions.

Show:

UNDO LAST MOVE


Maximum rollback depth:

5


Rollback should restore:

player position

current player

relevant turn state

question state where feasible

movement history

Do not attempt an unnecessarily complicated infinite undo system.

23. MANUAL PLAYER SELECTION

The presenter must be able to select any player at any time.

Display a compact player list:

1. Rohan
2. Priya
3. Amit
4. Sarah


Clicking a player selects their pawn.

Selected player should have a strong visual highlight.

This is especially important because the presenter is manually managing physical dice rolls.

24. GAME STATUS PANEL

Show:

Current Player
Turn Number
Questions Answered
Questions Remaining
Game Time


Also show player statistics.

For each player:

Player
Correct
Incorrect
Timeouts
Bonuses
Club
Bar
Jail
Current Position


Keep the panel compact.

25. WIN CONDITION

The objective is to travel around the entire board and return to Start.

A player wins when they complete one full circuit and return to the Start/finish position.

When a player wins:

Show a large celebration modal:

WINNER!

Congratulations, [PLAYER NAME]!


Show:

player name

correct answers

incorrect answers

bonuses

special events

number of turns

completed circuit

Allow:

END GAME


or:

CONTINUE PLAY


The presenter should be able to decide whether to stop after the first winner or continue.

26. GAME END

When presenter clicks:

END GAME

show confirmation:

Are you sure you want to end this game?

Buttons:

END & SAVE
CANCEL


When saved:

Persist the aggregated game record to the backend.

27. BACKEND DATA MODEL

Use the simplest reliable Lovable-supported backend/database.

Recommended logical entities:

games

Fields:

id
game_name
created_at
started_at
ended_at
status
number_of_players
winner_player_id
total_questions_used


Status:

configured
in_progress
paused
completed
abandoned


players

Fields:

id
game_id
player_number
player_name
pawn_color
final_position
correct_answers
incorrect_answers
timeouts
bonus_count
club_count
bar_count
jail_count
turns_taken
completed_circuit
final_rank


game_events

Store important aggregated/event information.

Fields:

id
game_id
player_id
event_type
position
dice_value
theme
difficulty
question_id
is_correct
created_at


Possible event types:

MOVE
QUESTION
CORRECT
INCORRECT
TIMEOUT
BONUS
CLUB
BAR
JAIL
MANUAL_MOVE
ROLLBACK


Do not store excessive temporary UI state if unnecessary.

questions

The CSV question bank should be imported into a questions table.

Fields:

id
record_id
record_type
difficulty
theme
question
option_a
option_b
option_c
option_d
correct_option
correct_answer
created_at


Use Record_ID as a unique logical identifier.

28. IMPORTANT GAME-SESSION RULE

The question usage state is per game session.

Do NOT permanently mark a question as used globally.

For example:

Game A:

Question Q001 used


Game B:

Q001 becomes eligible again.

Therefore:

usedQuestionIds


belongs to a particular game session.

29. GAME HISTORY

The landing page must include:

LOAD PREVIOUS GAME

Show a game-history table/card list.

Each entry:

Game Name
Date
Number of Players
Winner
Status


Allow:

VIEW

View completed game summary.

LOAD

Load previous game information.

RENAME

Rename the historical game.

DELETE

Optional, if easy to implement.

Do not delete data accidentally.

30. IMPORTANT DISTINCTION FOR LOADING GAMES

For MVP, loading a previous completed game primarily means:

view its results

view player statistics

view analytics

If resuming an in-progress game is implemented reliably, support it.

Otherwise, do not pretend that a completed game can be resumed.

The application should clearly distinguish:

VIEW RESULTS


from:

RESUME GAME


31. ANALYTICS DASHBOARD

Create an:

ANALYTICS

screen.

The presenter should be able to analyze:

One game

or:

Multiple selected games

or:

Entire history

32. ANALYTICS METRICS

Show leaderboard based primarily on:

Correct Answers

Leaderboard:

RankPlayerCorrectIncorrectAccuracy

Also show:

Total questions answered

Accuracy %

Timeout count

Bonus count

Club visits

Bar visits

Jail visits

Games played

Wins

33. HISTORY FILTER

Analytics should support:

All Games


or select one or more games.

Use simple filters rather than building a complex analytics engine.

34. QUESTION BANK MANAGEMENT

The homepage should contain:

QUESTION BANK

When opened, show:

Total questions

Easy count

Medium count

Hard count

Theme distribution

Provide:

BULK CSV UPLOAD

The user can upload additional questions using exactly the same CSV structure.

The system must:

Parse CSV.

Validate columns.

Validate rows.

Detect duplicate Record_ID.

Show preview.

Show number of valid/invalid rows.

Allow confirmation.

Insert valid questions.

Do not replace the existing question bank unless the user explicitly chooses:

Replace Existing Bank

Default behavior:

Append Questions

35. CSV UPLOAD UI

Create a clear workflow:

Upload Questions

Drag & Drop CSV
or
Choose CSV File


Then:

Questions found: 200
Valid: 198
Invalid: 2
Duplicates: 5


Show invalid-row errors.

Then:

IMPORT QUESTIONS

Also show:

Download CSV Template

The template must contain:

Record_Type
Record_ID
Difficulty
Theme
Question
Option_A
Option_B
Option_C
Option_D
Correct_Option
Correct_Answer


36. QUESTION BANK SEARCH

Provide a simple searchable question-bank view.

Filters:

Difficulty
Theme
Record Type


Search:

Search question...


This is useful for checking the uploaded dataset.

37. VISUAL DESIGN

The visual design should feel:

Premium

Corporate

Playful

Modern

Workshop-friendly

Highly polished

Avoid making it look like an academic test application.

Use:

Rounded cards

Subtle shadows

Strong typography

Smooth transitions

Clean icons

Modern gradients where appropriate

Clear hierarchy

The board itself should be visually interesting.

38. BOARD VISUAL DESIGN

The board should visually communicate:

START
↓
Question
↓
Bonus
↓
Question
↓
Question Mark
↓
Question
...


Each question square should show:

PATENT
EASY


or:

TRADEMARK
HARD


Difficulty should be visually distinguishable.

Theme should be readable.

Special squares should be visually distinct:

BONUS
?
CLUB
BAR
JAIL
START


39. PAWN DESIGN

Pawns should look like actual game pieces.

Each pawn:

circular/rounded game token

colored

sequence number inside

player name displayed above

subtle shadow

smooth movement animation

When selected:

enlarge slightly

show glow/border

display player's current position

40. RESPONSIVENESS

Primary target:

Desktop / laptop / large display

Secondary target:

Tablet

Do not over-optimize for mobile in MVP.

The game board must remain usable on a projector or workshop screen.

Question text must be readable from a reasonable distance.

41. ACCESSIBILITY

Use:

readable font sizes

sufficient contrast

keyboard-friendly controls where practical

clear text labels

do not rely solely on color to communicate correct/incorrect

For example:

Correct:

✓ CORRECT


Incorrect:

✕ INCORRECT


42. GAME STATE MACHINE

Implement gameplay as a clear state machine.

Possible states:

SETUP
READY
PLAYER_TURN
MOVING
QUESTION_ACTIVE
ANSWER_SELECTED
ANSWER_REVEALED
BONUS_ACTION
SPECIAL_EVENT
PAUSED
WINNER
GAME_COMPLETE


Do not allow contradictory actions.

Example:

While:

QUESTION_ACTIVE


the presenter should not be able to move another pawn.

While:

PAUSED


the timer must stop.

43. TURN STATE

Maintain:

currentPlayerId


After correct answer:

currentPlayerId remains unchanged


After wrong answer:

currentPlayerId = next eligible player


After timeout:

currentPlayerId = next eligible player


Players serving Club/Bar/Jail restrictions should be skipped or handled according to their status.

44. DICE VALIDATION

Presenter-entered dice value must be:

1
2
3
4
5
6


Reject:

0

negative numbers

decimals

6

text

Display a friendly error.

45. BONUS MOVEMENT

If a player lands on Bonus:

Show bonus modal.

Show bonus amount.

Automatically move pawn.

Record bonus.

Check final landing square.

If final square is a question square, present the corresponding question.

Avoid infinite bonus loops.

If a bonus leads to another bonus, process only according to a safe configured rule.

Prefer:

maximum 1 automatic bonus chain per turn


for MVP.

46. QUESTION MARK EVENTS

Question Mark squares should use the dice value that caused the player to land there.

Example default configuration:

1 → BAR
2 → BONUS +2
3 → JAIL
4 → CLUB
5 → BAR
6 → BONUS +3


However, implement this as configurable data:

EVENT_RULES = {
  1: {...},
  2: {...},
  3: {...},
  4: {...},
  5: {...},
  6: {...}
}


This allows the rules to be changed later.

47. GAME PAUSE

Pause must freeze:

timer

current question

current player

animations where practical

turn state

On resume:

timer continues from remaining seconds

no new question is generated

current question remains visible

48. ROLLBACK

Maintain a movement history stack containing at least the last five meaningful actions.

Example:

Move 1
Move 2
Move 3
Move 4
Move 5


Presenter can click:

UNDO

Restore previous state.

Maximum:

5 rollbacks


Show:

Undo available: 3


If no rollback exists:

No previous actions available.


49. GAME NAME

Game name must be editable:

During setup

Yes.

During gameplay

Yes.

From game history

Yes.

Use the same underlying game record.

50. GAME SAVE STRATEGY

Do not write every timer tick to the backend.

Do NOT persist:

every second


Instead:

Persist:

game creation

player setup

important game events

completed question results

significant movement

final aggregated results

game completion

This keeps the backend simple and efficient.

51. FRONTEND VS BACKEND

FRONTEND

The frontend should manage:

board rendering

pawn movement

timer

current question

current turn

temporary used-question state

answer selection

animations

pause

rollback stack

presenter controls

dice input

temporary game state

BACKEND

Persist:

question bank

game metadata

players

completed game statistics

important game events

historical results

analytics data

Do not over-persist transient UI state.

52. INITIAL DATA IMPORT

The application must support importing the supplied initial CSV question bank.

If Lovable cannot automatically ingest the supplied file during initial build, create the CSV upload mechanism first and make the application ready to import the supplied dataset.

The application's question engine must be built around the CSV schema, not around hard-coded sample questions.

53. SAMPLE BOARD CONFIGURATION

Create approximately 24 perimeter positions.

Use four corners:

0  START
6  CLUB
12 BAR
18 JAIL


The remaining positions should include:

Patent

Trademark

IP Fundamentals

Prior Art

Inventorship

Patentability

Trade Secrets

SEPs / Standards

Copyright

Use Easy / Medium / Hard combinations.

Include approximately:

17–19 Question squares

2–3 Bonus squares

3–4 Question Mark/Event squares

4 corner special squares

The exact theme/difficulty assignments should be centralized in the board configuration.

54. IMPORTANT: DO NOT RANDOMIZE BOARD CATEGORIES DURING A GAME

The board position itself should remain fixed for the entire game.

Example:

Position 1 = Patent / Easy
Position 2 = Trademark / Medium
Position 3 = Prior Art / Hard


Do not change these assignments when players move.

Only the question selected within the relevant category is randomized.

55. QUESTION SELECTION EXAMPLE

If Player 2 lands on:

Position 7

Theme = Trademark
Difficulty = Medium


The system queries:

questions
WHERE theme = "Trademark"
AND difficulty = "Medium"
AND record_id NOT IN usedQuestionIds


Then randomly selects one.

Once selected:

usedQuestionIds.add(record_id)


This question cannot appear again during this game.

56. QUESTION ANSWER RECORD

When a question is completed, record:

game_id
player_id
question_id
theme
difficulty
selected_option
correct_option
is_correct
is_timeout
position
created_at


This allows future analytics such as:

hardest themes

easiest themes

player accuracy by difficulty

player accuracy by theme

You do not need to expose all these analytics in MVP, but store enough data to enable them later.

57. ANALYTICS — MVP

At minimum provide:

Overall leaderboard

Correct answers across all completed games.

Selected game leaderboard

Correct answers within selected game(s).

Player statistics

Correct
Incorrect
Accuracy
Wins
Games Played


Game statistics

Questions Used
Average Accuracy
Total Players
Winner


58. FUTURE-READY ANALYTICS

Structure the data so later we can add:

accuracy by theme

accuracy by difficulty

most difficult questions

most frequently answered questions

average answer time

player improvement over time

team performance

workshop performance

question-level performance

Do not implement all of these now unless easy.

59. NO ONLINE MULTIPLAYER FOR NOW

Do NOT build:

user accounts

player login

remote player devices

WebSockets

live synchronization

online matchmaking

remote answering

This is an offline presenter-controlled workshop game.

The presenter controls everything from one screen.

60. HOME PAGE

The home page should have a polished dashboard.

Title:

BUSINESS OF IP GAME

Subtitle:

An interactive IP awareness board game

Main actions:

CREATE NEW GAME
LOAD PREVIOUS GAME
QUESTION BANK
ANALYTICS


Also show small summary cards:

Questions
Games Played
Players


61. NAVIGATION

Use simple navigation:

Home
New Game
Question Bank
Game History
Analytics


During gameplay, minimize navigation so the presenter does not accidentally leave the game.

62. CONFIRMATION DIALOGS

Use confirmations for destructive actions:

End game

Reset used questions

Delete game

Replace question bank

Do not require confirmation for:

selecting player

entering dice

answering question

63. ERROR HANDLING

Handle gracefully:

No questions available

Show:

No unused questions are available for this Theme + Difficulty combination.

CSV upload failure

Show exact validation issue.

Backend unavailable

The game should still ideally remain playable using current frontend state.

Show:

Your current game is still active, but saving to game history is temporarily unavailable.

Do not crash the game.

64. PERFORMANCE

The question bank may contain 1,500+ questions.

Do not render all questions at once.

Load/query/filter efficiently.

The board contains only approximately 24 positions.

Animations should be lightweight.

Avoid unnecessary libraries.

65. CODE ORGANIZATION

Keep major components separated logically.

Suggested components:

App
HomePage
NewGamePage
GameBoard
BoardSquare
PlayerPawn
PresenterControls
QuestionPanel
AnswerOption
Timer
PlayerList
GameStatus
GameControls
PauseOverlay
WinnerModal
GameHistory
QuestionBank
CSVUploader
AnalyticsDashboard


Suggested logical services:

questionService
gameService
analyticsService
csvService


Do not create excessive abstraction.

66. CENTRAL GAME CONFIGURATION

Create one configuration object for:

BOARD_POSITIONS
EVENT_RULES
GAME_SETTINGS


Example:

GAME_SETTINGS = {
  QUESTION_TIME_SECONDS: 15,
  MAX_PLAYERS: 10,
  MAX_ROLLBACKS: 5,
  MAX_BONUS_CHAIN: 1
}


This makes future changes easy.

67. DEFAULT GAME RULES

Use:

Question timer = 15 seconds
Maximum players = 10
Maximum rollback = 5
Dice = physical/offline input
Correct answer = retain turn
Wrong answer = next player
Timeout = next player
Bonus = automatic movement
Club = miss 1 turn
Bar = miss 2 turns
Jail = roll 1 or 6 to escape


68. IMPORTANT UX DETAIL

At all times the presenter should know:

Who is playing?

What dice value was entered?

Where did the pawn land?

What category is that square?

What question is active?

How much time remains?

Whether the answer was correct?

Whose turn is next?

Make these visually obvious.

69. GAMEPLAY FLOW EXAMPLE

Example:

Player 1 starts at Start.

Presenter selects:

Player 1


Presenter enters:

Dice = 3


Clicks:

MOVE


Player 1 moves three spaces.

Landing square:

TRADEMARK
MEDIUM


System selects an unused Medium Trademark question.

Question appears.

Timer:

15


Presenter selects answer B.

B becomes orange.

System reveals:

B = GREEN


Display:

CORRECT!


Player retains turn.

Presenter enters another dice value:

5


Player moves 5.

New landing square determines the next question/event.

If incorrect:

Turn passes to Player 2.


This exact turn behavior must be implemented.

70. WIN EXAMPLE

Player completes the circuit and reaches Start.

Show:

🏆 WINNER

PLAYER 4
Ananya

Correct Answers: 14
Accuracy: 78%
Bonuses: 2
Club Visits: 1
Bar Visits: 0
Jail Visits: 1


Then:

END & SAVE
CONTINUE GAME


71. DO NOT OVERBUILD

This is important because I am using the free Lovable plan.

Do NOT implement at this stage:

online multiplayer

authentication

chat

social sharing

complex permissions

AI-generated questions

external AI APIs

payment systems

notifications

email

mobile apps

complicated real-time infrastructure

unnecessary animations that hurt performance

Focus on:

Excellent board game + question engine + presenter controls + persistent history + analytics + CSV question upload.

72. BUILD PRIORITY

Implement in this order:

PRIORITY 1 — CORE

Home page

New game setup

Player setup

Board

Pawns

Dice input

Movement

Board categories

Question selection

15-second timer

Answer handling

Correct/wrong turn logic

PRIORITY 2 — GAME CONTROL

Pause

Bonus

Event/question-mark squares

Club

Bar

Jail

Winner detection

Rename player/game

Manual move

Question replacement

Five-step rollback

PRIORITY 3 — DATA

Question database

Game persistence

Game history

Game results

PRIORITY 4 — MANAGEMENT

CSV upload

Question-bank browser

Analytics

Historical leaderboard

Do not sacrifice Priority 1 functionality to build lower-priority features.

73. ACCEPTANCE TESTS

Before considering the application complete, test the following scenarios.

TEST 1

Create a game with 2 players.

Both pawns begin at Start.

TEST 2

Player 1 rolls 3.

Pawn moves exactly 3 positions.

TEST 3

Player lands on:

Patent / Easy


System displays an unused Easy Patent question.

TEST 4

Answer correctly.

Current player gets another turn.

TEST 5

Answer incorrectly.

Turn passes to next player.

TEST 6

Allow timer to reach zero.

Question becomes wrong/timeout.

Turn passes.

TEST 7

Pause game while timer shows 9 seconds.

Timer remains at approximately 9 seconds.

Resume.

Timer continues.

TEST 8

Player lands on Bonus.

Pawn automatically advances according to bonus value.

TEST 9

Player lands on Question Mark.

Outcome depends on dice value.

TEST 10

Player enters Jail.

Player cannot proceed normally until Jail release condition is satisfied.

TEST 11

Same Theme + Difficulty appears twice during a game.

The second question must be different from the first.

TEST 12

Start a new game.

Previously used questions become eligible again.

TEST 13

Presenter requests "Different Question".

The current unused question is replaced by another unused question with the same Theme + Difficulty.

TEST 14

Presenter uses Undo.

The previous movement state is restored.

Maximum five undo operations.

TEST 15

Presenter renames player.

New name appears on pawn and player list.

TEST 16

Presenter ends game.

Game is saved to history.

TEST 17

Open Analytics.

Completed game appears.

TEST 18

Upload a valid CSV.

Questions are added to the question bank.

TEST 19

Upload CSV with missing required column.

Upload is rejected with a clear error.

TEST 20

Upload CSV containing duplicate Record_ID.

Duplicates are detected.

74. DESIGN PRINCIPLE

The most important design principle is:

The presenter should be able to run the entire game without touching anything except this application and a physical dice.

The application should handle:

Board
Pawn movement
Question selection
Timer
Answer reveal
Turn management
Bonuses
Special events
Scoring
Game history
Analytics


The presenter should only need to:

Select player
Enter dice value
Select answer
Use admin controls when required


75. FINAL IMPLEMENTATION INSTRUCTION

Build the application as a complete functional MVP now.

Do not merely create static screens.

All core interactions must work.

Use the supplied CSV schema as the question-bank contract.

Make the question engine independent from the UI.

Make board configuration independent from gameplay logic.

Make game configuration independent from historical analytics.

Keep the architecture simple enough for a free-tier Lovable project.

Prioritize correctness and a polished presenter experience over unnecessary technical complexity.

After implementing, run through the acceptance tests above and fix obvious gameplay/state issues.

The final experience should feel like a professionally designed corporate IP awareness board game, not a generic quiz application.

Seeding question bank is attached for reference ; seed all these questions to start with ; 
also a template board for game of business is shown in the image attached for reference

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rakuten-whip.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/41e85062-82df-42ca-a7a1-0d41214b9299).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
