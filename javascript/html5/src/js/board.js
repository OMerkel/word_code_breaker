// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

import {
	DEFAULT_SETTINGS,
	getKeyboardRows,
	mulberry32,
	normalizeSettings,
	randomInt,
	WORD_LENGTH,
} from "./common.js";

export const GAME_STATUS = Object.freeze({
	PLAYING: "playing",
	WON: "won",
	LOST: "lost",
});

export const INPUT_ACTIONS = Object.freeze({
	APPEND: "append",
	BACKSPACE: "backspace",
	SUBMIT: "submit",
	CLEAR: "clear",
});

export const LETTER_FEEDBACK = Object.freeze({
	CORRECT: "correct",
	PRESENT: "present",
	ABSENT: "absent",
});

const defaultNow = () => Date.now();

// ß must not be uppercased — JS uppercases it to "SS"
const normalizeChar = (ch) => (ch === "ß" ? "ß" : ch.toUpperCase());

const pickSecret = (wordList, seed) => {
	const random = mulberry32(seed);
	const index = randomInt(random, wordList.length);
	return Array.from(wordList[index]).map(normalizeChar);
};

export const scoreWordGuess = (secret, guess) => {
	if (secret.length !== guess.length) {
		throw new Error("Secret and guess must have equal length");
	}
	const result = new Array(secret.length).fill(LETTER_FEEDBACK.ABSENT);
	const remaining = {};

	for (let i = 0; i < secret.length; i++) {
		if (guess[i] === secret[i]) {
			result[i] = LETTER_FEEDBACK.CORRECT;
		} else {
			remaining[secret[i]] = (remaining[secret[i]] ?? 0) + 1;
		}
	}

	for (let i = 0; i < guess.length; i++) {
		if (result[i] !== LETTER_FEEDBACK.CORRECT && remaining[guess[i]] > 0) {
			result[i] = LETTER_FEEDBACK.PRESENT;
			remaining[guess[i]]--;
		}
	}

	return result;
};

export const getIndirectScore = (feedback) =>
	feedback.filter(
		(f) => f === LETTER_FEEDBACK.CORRECT || f === LETTER_FEEDBACK.PRESENT,
	).length;

const buildLetterStates = (history) => {
	const priority = {
		[LETTER_FEEDBACK.CORRECT]: 3,
		[LETTER_FEEDBACK.PRESENT]: 2,
		[LETTER_FEEDBACK.ABSENT]: 1,
	};
	const states = {};
	for (const entry of history) {
		for (let i = 0; i < entry.guess.length; i++) {
			const letter = entry.guess[i];
			const fb = entry.feedback[i];
			if (!states[letter] || priority[fb] > priority[states[letter]]) {
				states[letter] = fb;
			}
		}
	}
	return states;
};

const buildMessage = (board) => {
	if (board.status === GAME_STATUS.WON) {
		return `Solved in ${board.history.length} attempt${board.history.length === 1 ? "" : "s"}.`;
	}
	if (board.status === GAME_STATUS.LOST) {
		return `No attempts left. The secret word was ${board.secret.join("")}.`;
	}
	if (board.currentGuess.length === WORD_LENGTH) {
		return "Press Enter to submit your guess.";
	}
	return `Enter a ${WORD_LENGTH}-letter word.`;
};

const updateDerivedState = (board) => ({
	...board,
	keyboardRows: getKeyboardRows(board.settings.language),
	letterStates: buildLetterStates(board.history),
	attemptsUsed: board.history.length,
	attemptsRemaining:
		board.settings.maxAttempts === null
			? null
			: Math.max(board.settings.maxAttempts - board.history.length, 0),
	canSubmit:
		board.status === GAME_STATUS.PLAYING &&
		board.currentGuess.length === WORD_LENGTH,
	message: buildMessage(board),
});

export const createBoard = ({
	settings = DEFAULT_SETTINGS,
	wordList = [],
	seed,
	now,
} = {}) => {
	const normalizedSettings = normalizeSettings(settings);
	const resolvedSeed = Number.isInteger(seed)
		? seed
		: (Date.now() * 2654435761) >>> 0;
	const createdAt = Number.isFinite(now) ? now : defaultNow();
	const secret =
		wordList.length > 0
			? pickSecret(wordList, resolvedSeed)
			: ["W", "O", "R", "D", "S"];

	return updateDerivedState({
		seed: resolvedSeed,
		createdAt,
		firstInputAt: null,
		finishedAt: null,
		status: GAME_STATUS.PLAYING,
		animation: "idle",
		invalidWord: false,
		settings: normalizedSettings,
		secret,
		currentGuess: [],
		history: [],
	});
};

export class Board {
	constructor(initialState = createBoard()) {
		this.state = initialState;
	}

	getState() {
		return this.state;
	}

	setState(nextState) {
		this.state = nextState;
	}
}

export const canSubmitGuess = (board) =>
	board.status === GAME_STATUS.PLAYING &&
	board.currentGuess.length === WORD_LENGTH;

const appendLetter = (board, letter, now) => {
	if (board.status !== GAME_STATUS.PLAYING) return board;
	if (typeof letter !== "string" || letter.length !== 1) return board;
	if (board.currentGuess.length >= WORD_LENGTH) return board;

	return updateDerivedState({
		...board,
		invalidWord: false,
		firstInputAt: board.firstInputAt ?? now,
		currentGuess: [...board.currentGuess, normalizeChar(letter)],
	});
};

const backspaceLetter = (board) => {
	if (board.status !== GAME_STATUS.PLAYING) return board;
	if (board.currentGuess.length === 0) return board;

	return updateDerivedState({
		...board,
		invalidWord: false,
		currentGuess: board.currentGuess.slice(0, -1),
	});
};

const clearGuess = (board) => {
	if (board.status !== GAME_STATUS.PLAYING) return board;
	if (board.currentGuess.length === 0) return board;
	return updateDerivedState({ ...board, invalidWord: false, currentGuess: [] });
};

export const submitGuess = (board, now = defaultNow()) => {
	if (!canSubmitGuess(board)) return board;

	const feedback = scoreWordGuess(board.secret, board.currentGuess);
	const indirectScore = getIndirectScore(feedback);
	const nextHistory = [
		...board.history,
		{
			guess: [...board.currentGuess],
			feedback,
			indirectScore,
		},
	];
	const isWon = board.currentGuess.every(
		(letter, i) => letter === board.secret[i],
	);
	const reachedAttemptLimit =
		board.settings.maxAttempts !== null &&
		nextHistory.length >= board.settings.maxAttempts;
	const status = isWon
		? GAME_STATUS.WON
		: reachedAttemptLimit
			? GAME_STATUS.LOST
			: GAME_STATUS.PLAYING;

	return updateDerivedState({
		...board,
		history: nextHistory,
		currentGuess: [],
		status,
		invalidWord: false,
		animation: isWon ? "idle" : status === GAME_STATUS.LOST ? "tilt" : "idle",
		finishedAt: status === GAME_STATUS.PLAYING ? null : now,
	});
};

export const markInvalidWord = (board) =>
	updateDerivedState({ ...board, invalidWord: true, animation: "shake" });

export const applyAction = (board, action, now = defaultNow()) => {
	if (!action || typeof action !== "object") return board;
	switch (action.type) {
		case INPUT_ACTIONS.APPEND:
			return appendLetter(board, action.letter, now);
		case INPUT_ACTIONS.BACKSPACE:
			return backspaceLetter(board);
		case INPUT_ACTIONS.CLEAR:
			return clearGuess(board);
		case INPUT_ACTIONS.SUBMIT:
			return submitGuess(board, now);
		default:
			return board;
	}
};

export const getElapsedSeconds = (board, now = defaultNow()) => {
	if (!board.firstInputAt) return 0;
	const end = board.finishedAt ?? now;
	return Math.max(Math.floor((end - board.firstInputAt) / 1000), 0);
};

export const isHighscoreEligible = (board) => board.status === GAME_STATUS.WON;

export const getHighscoreEntry = (board, now = defaultNow()) => {
	if (!isHighscoreEligible(board)) return null;
	return {
		attempts: board.history.length,
		seconds: getElapsedSeconds(board, now),
		language: board.settings.language,
		maxAttempts: board.settings.maxAttempts,
	};
};

export const withSecret = (board, secretWord) => {
	const secret =
		typeof secretWord === "string"
			? Array.from(secretWord).map(normalizeChar)
			: secretWord;
	if (!Array.isArray(secret) || secret.length !== WORD_LENGTH) {
		throw new Error(`Secret must be ${WORD_LENGTH} letters`);
	}
	return updateDerivedState({ ...board, secret: [...secret] });
};
