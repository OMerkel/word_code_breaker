import { describe, expect, it } from "vitest";
import {
	applyAction,
	canSubmitGuess,
	createBoard,
	GAME_STATUS,
	getElapsedSeconds,
	getHighscoreEntry,
	getIndirectScore,
	INPUT_ACTIONS,
	isHighscoreEligible,
	LETTER_FEEDBACK,
	markInvalidWord,
	scoreWordGuess,
	submitGuess,
	withSecret,
} from "../../js/board.js";

const DEFAULT_WORD_LIST = ["ABOUT", "ABOVE", "ABUSE", "ACTED", "ACUTE"];

const withGuess = (board, letters, now = 1000) =>
	letters.reduce(
		(state, letter, index) =>
			applyAction(state, { type: INPUT_ACTIONS.APPEND, letter }, now + index),
		board,
	);

describe("createBoard", () => {
	it("creates deterministic secret for a fixed seed", () => {
		const a = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 123 });
		const b = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 123 });
		expect(a.secret).toEqual(b.secret);
	});

	it("falls back to WORDS when word list is empty", () => {
		const board = createBoard({ wordList: [], seed: 1 });
		expect(board.secret).toHaveLength(5);
	});

	it("normalizes settings and sets language-appropriate keyboard", () => {
		const board = createBoard({
			settings: { language: "de", maxAttempts: 8 },
			wordList: DEFAULT_WORD_LIST,
			seed: 7,
			now: 400,
		});
		expect(board.createdAt).toBe(400);
		expect(board.settings.language).toBe("de");
		expect(board.settings.maxAttempts).toBe(8);
		expect(board.status).toBe(GAME_STATUS.PLAYING);
		expect(board.canSubmit).toBe(false);
		// DE keyboard has Ä, Ö, Ü
		const allKeys = board.keyboardRows.flat();
		expect(allKeys).toContain("Ä");
		expect(allKeys).toContain("Ö");
		expect(allKeys).toContain("Ü");
	});

	it("DE keyboard has ß", () => {
		const board = createBoard({
			settings: { language: "de" },
			wordList: DEFAULT_WORD_LIST,
			seed: 1,
		});
		const allKeys = board.keyboardRows.flat();
		expect(allKeys).toContain("ß");
	});
});

describe("ß handling", () => {
	it("appends ß without uppercasing to SS", () => {
		const board = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 });
		const next = applyAction(
			board,
			{ type: INPUT_ACTIONS.APPEND, letter: "ß" },
			1,
		);
		expect(next.currentGuess).toEqual(["ß"]);
	});

	it("withSecret preserves ß in secret", () => {
		const board = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 });
		const next = withSecret(board, "STRAß");
		expect(next.secret).toEqual(["S", "T", "R", "A", "ß"]);
	});

	it("scoreWordGuess works with ß", () => {
		const result = scoreWordGuess(
			["H", "E", "I", "ß", "E"],
			["H", "E", "I", "ß", "E"],
		);
		expect(result).toEqual(new Array(5).fill(LETTER_FEEDBACK.CORRECT));
	});
});

describe("scoreWordGuess", () => {
	it("returns all correct when guess equals secret", () => {
		expect(
			scoreWordGuess(["W", "O", "R", "L", "D"], ["W", "O", "R", "L", "D"]),
		).toEqual([
			LETTER_FEEDBACK.CORRECT,
			LETTER_FEEDBACK.CORRECT,
			LETTER_FEEDBACK.CORRECT,
			LETTER_FEEDBACK.CORRECT,
			LETTER_FEEDBACK.CORRECT,
		]);
	});

	it("marks present and absent letters", () => {
		const result = scoreWordGuess(
			["W", "O", "R", "L", "D"],
			["W", "O", "R", "D", "L"],
		);
		expect(result[0]).toBe(LETTER_FEEDBACK.CORRECT);
		expect(result[1]).toBe(LETTER_FEEDBACK.CORRECT);
		expect(result[2]).toBe(LETTER_FEEDBACK.CORRECT);
		expect(result[3]).toBe(LETTER_FEEDBACK.PRESENT);
		expect(result[4]).toBe(LETTER_FEEDBACK.PRESENT);
	});

	it("handles duplicate letters correctly", () => {
		// Secret AABBC, guess AACDD — only 2 As match, third usage is absent
		const result = scoreWordGuess(
			["A", "A", "B", "B", "C"],
			["A", "A", "C", "D", "D"],
		);
		expect(result[0]).toBe(LETTER_FEEDBACK.CORRECT);
		expect(result[1]).toBe(LETTER_FEEDBACK.CORRECT);
		expect(result[2]).toBe(LETTER_FEEDBACK.PRESENT);
		expect(result[3]).toBe(LETTER_FEEDBACK.ABSENT);
		expect(result[4]).toBe(LETTER_FEEDBACK.ABSENT);
	});

	it("throws when lengths differ", () => {
		expect(() => scoreWordGuess(["A", "B"], ["A"])).toThrow(/equal length/);
	});
});

describe("getIndirectScore", () => {
	it("counts correct and present, ignores absent", () => {
		expect(
			getIndirectScore([
				LETTER_FEEDBACK.CORRECT,
				LETTER_FEEDBACK.PRESENT,
				LETTER_FEEDBACK.ABSENT,
				LETTER_FEEDBACK.ABSENT,
				LETTER_FEEDBACK.CORRECT,
			]),
		).toBe(3);
	});

	it("returns zero for all absent", () => {
		expect(getIndirectScore(new Array(5).fill(LETTER_FEEDBACK.ABSENT))).toBe(0);
	});
});

describe("input handling", () => {
	it("appends letters immutably and tracks first input time", () => {
		const board = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 });
		const next = applyAction(
			board,
			{ type: INPUT_ACTIONS.APPEND, letter: "A" },
			55,
		);
		expect(next).not.toBe(board);
		expect(next.currentGuess).toEqual(["A"]);
		expect(next.firstInputAt).toBe(55);
		expect(board.currentGuess).toEqual([]);
	});

	it("uppercases appended letters", () => {
		const board = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 });
		const next = applyAction(
			board,
			{ type: INPUT_ACTIONS.APPEND, letter: "a" },
			1,
		);
		expect(next.currentGuess).toEqual(["A"]);
	});

	it("rejects invalid value types and ignores input past 5 letters", () => {
		const board = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 });
		expect(
			applyAction(board, { type: INPUT_ACTIONS.APPEND, letter: 99 }, 1),
		).toBe(board);

		const full = withGuess(board, ["A", "B", "O", "U", "T"]);
		expect(canSubmitGuess(full)).toBe(true);
		expect(
			applyAction(full, { type: INPUT_ACTIONS.APPEND, letter: "Z" }, 99),
		).toBe(full);
	});

	it("supports backspace and clear", () => {
		const board = withGuess(
			createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 }),
			["A", "B", "O"],
		);
		const shorter = applyAction(board, { type: INPUT_ACTIONS.BACKSPACE });
		expect(shorter.currentGuess).toEqual(["A", "B"]);

		const cleared = applyAction(shorter, { type: INPUT_ACTIONS.CLEAR });
		expect(cleared.currentGuess).toEqual([]);
	});

	it("ignores invalid action objects and unknown action types", () => {
		const board = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 9 });
		expect(applyAction(board, null)).toBe(board);
		expect(applyAction(board, "bad")).toBe(board);
		expect(applyAction(board, { type: "mystery" })).toBe(board);
	});

	it("returns same board when backspace or clear on empty guess", () => {
		const board = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 12 });
		expect(applyAction(board, { type: INPUT_ACTIONS.BACKSPACE })).toBe(board);
		expect(applyAction(board, { type: INPUT_ACTIONS.CLEAR })).toBe(board);
	});

	it("ignores editing actions after the game is won", () => {
		const solved = submitGuess(
			withGuess(
				withSecret(
					createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 }),
					"ABOUT",
				),
				["A", "B", "O", "U", "T"],
			),
			500,
		);
		expect(applyAction(solved, { type: INPUT_ACTIONS.BACKSPACE })).toBe(solved);
		expect(applyAction(solved, { type: INPUT_ACTIONS.CLEAR })).toBe(solved);
	});

	it("clears invalidWord flag when new letter is appended", () => {
		const board = markInvalidWord(
			withGuess(createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 }), [
				"A",
				"B",
				"O",
				"U",
				"T",
			]),
		);
		expect(board.invalidWord).toBe(true);
		const next = applyAction(board, { type: INPUT_ACTIONS.BACKSPACE });
		expect(next.invalidWord).toBe(false);
	});
});

describe("submitGuess", () => {
	it("wins when the guess matches the secret", () => {
		const board = withSecret(
			createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 }),
			"ABOUT",
		);
		const ready = withGuess(board, ["A", "B", "O", "U", "T"], 500);
		const solved = submitGuess(ready, 2600);

		expect(solved.status).toBe(GAME_STATUS.WON);
		expect(solved.animation).toBe("idle");
		expect(solved.finishedAt).toBe(2600);
		expect(solved.history).toHaveLength(1);
		expect(solved.history[0].feedback).toEqual(
			new Array(5).fill(LETTER_FEEDBACK.CORRECT),
		);
		expect(solved.currentGuess).toEqual([]);
		expect(solved.message).toMatch(/Solved in 1 attempt/);
	});

	it("loses when the attempt limit is reached without solving", () => {
		let board = withSecret(
			createBoard({
				settings: { maxAttempts: 6 },
				wordList: DEFAULT_WORD_LIST,
				seed: 2,
			}),
			"ABOUT",
		);
		for (let i = 0; i < 6; i++) {
			board = withGuess(board, ["Z", "Z", "Z", "Z", "Z"], 1000 + i * 10);
			board = submitGuess(board, 2000 + i * 10);
		}
		expect(board.status).toBe(GAME_STATUS.LOST);
		expect(board.animation).toBe("tilt");
		expect(board.history).toHaveLength(6);
		expect(board.attemptsRemaining).toBe(0);
		expect(board.message).toMatch(/No attempts left/);
	});

	it("stays in play when attempts remain", () => {
		const board = withSecret(
			createBoard({ wordList: DEFAULT_WORD_LIST, seed: 3 }),
			"ABOUT",
		);
		const ready = withGuess(board, ["A", "B", "O", "V", "E"], 100);
		const next = submitGuess(ready, 600);

		expect(next.status).toBe(GAME_STATUS.PLAYING);
		expect(next.animation).toBe("idle");
		expect(next.currentGuess).toEqual([]);
	});

	it("returns same board when submit is not allowed", () => {
		const board = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 4 });
		expect(submitGuess(board, 200)).toBe(board);
	});

	it("supports submit through applyAction", () => {
		const board = withSecret(
			createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 }),
			"ABOUT",
		);
		const ready = withGuess(board, ["A", "B", "O", "U", "T"], 100);
		const solved = applyAction(ready, { type: INPUT_ACTIONS.SUBMIT }, 900);
		expect(solved.status).toBe(GAME_STATUS.WON);
		expect(solved.finishedAt).toBe(900);
	});

	it("updates letter states after submission", () => {
		const board = withSecret(
			createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 }),
			"ABOUT",
		);
		const ready = withGuess(board, ["A", "B", "C", "D", "E"], 100);
		const next = submitGuess(ready, 600);
		expect(next.letterStates.A).toBe(LETTER_FEEDBACK.CORRECT);
		expect(next.letterStates.B).toBe(LETTER_FEEDBACK.CORRECT);
		expect(next.letterStates.C).toBe(LETTER_FEEDBACK.ABSENT);
	});
});

describe("markInvalidWord", () => {
	it("sets invalidWord and shake animation", () => {
		const board = withGuess(
			createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 }),
			["X", "Y", "Z", "Z", "Z"],
		);
		const invalid = markInvalidWord(board);
		expect(invalid.invalidWord).toBe(true);
		expect(invalid.animation).toBe("shake");
		expect(invalid.currentGuess).toEqual(board.currentGuess);
	});
});

describe("elapsed time and highscore", () => {
	it("returns 0 when no input yet", () => {
		const board = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1, now: 0 });
		expect(getElapsedSeconds(board, 5000)).toBe(0);
	});

	it("measures seconds from first input to solved", () => {
		const board = withSecret(
			createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1, now: 0 }),
			"ABOUT",
		);
		const started = withGuess(board, ["A", "B", "O", "U", "T"], 1000);
		const solved = submitGuess(started, 6000);
		expect(getElapsedSeconds(solved, 9000)).toBe(5);
	});

	it("isHighscoreEligible returns true only for won games", () => {
		const board = withSecret(
			createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 }),
			"ABOUT",
		);
		expect(isHighscoreEligible(board)).toBe(false);
		const solved = submitGuess(
			withGuess(board, ["A", "B", "O", "U", "T"], 1000),
			2000,
		);
		expect(isHighscoreEligible(solved)).toBe(true);
	});

	it("getHighscoreEntry includes language and attempts", () => {
		const board = withSecret(
			createBoard({
				settings: { language: "de", maxAttempts: 6 },
				wordList: DEFAULT_WORD_LIST,
				seed: 1,
			}),
			"ABOUT",
		);
		const solved = submitGuess(
			withGuess(board, ["A", "B", "O", "U", "T"], 1000),
			4000,
		);
		const entry = getHighscoreEntry(solved);
		expect(entry.attempts).toBe(1);
		expect(entry.seconds).toBe(3);
		expect(entry.language).toBe("de");
	});
});

describe("withSecret", () => {
	it("accepts a string and splits it", () => {
		const board = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 });
		const next = withSecret(board, "WORLD");
		expect(next.secret).toEqual(["W", "O", "R", "L", "D"]);
	});

	it("throws for wrong length", () => {
		const board = createBoard({ wordList: DEFAULT_WORD_LIST, seed: 1 });
		expect(() => withSecret(board, "AB")).toThrow(/5 letters/);
	});
});
