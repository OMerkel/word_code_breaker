// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

export const WORD_LENGTH = 5;
export const LANGUAGE_OPTIONS = Object.freeze(["en", "de"]);
export const MAX_ATTEMPTS_OPTIONS = Object.freeze([6, 8, 10, null]);

export const DEFAULT_SETTINGS = Object.freeze({
	language: "en",
	maxAttempts: 6,
	directFeedback: true,
	indirectFeedback: false,
});

// English QWERTY keyboard rows (no umlauts)
export const EN_KEYBOARD_ROWS = Object.freeze([
	Object.freeze(["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"]),
	Object.freeze(["A", "S", "D", "F", "G", "H", "J", "K", "L"]),
	Object.freeze(["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"]),
]);

// German QWERTZ keyboard rows (with Umlauts Ä, Ö, Ü and ß)
export const DE_KEYBOARD_ROWS = Object.freeze([
	Object.freeze(["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Ü"]),
	Object.freeze(["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ö", "Ä"]),
	Object.freeze(["ENTER", "Y", "X", "C", "V", "B", "N", "M", "ß", "BACK"]),
]);

export const getKeyboardRows = (language) =>
	language === "de" ? DE_KEYBOARD_ROWS : EN_KEYBOARD_ROWS;

export const pad2 = (value) => String(value).padStart(2, "0");

export const mulberry32 = (seed) => {
	let current = seed >>> 0;
	return () => {
		current += 0x6d2b79f5;
		let next = Math.imul(current ^ (current >>> 15), 1 | current);
		next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
		return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
	};
};

export const randomInt = (random, maxExclusive) =>
	Math.floor(random() * maxExclusive);

export const shuffle = (values, randomFn) => {
	const next = [...values];
	for (let index = next.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(randomFn() * (index + 1));
		[next[index], next[swapIndex]] = [next[swapIndex], next[index]];
	}
	return next;
};

const normalizeBool = (value, defaultVal) => {
	if (typeof value === "boolean") return value;
	if (value === "true") return true;
	if (value === "false") return false;
	return defaultVal;
};

export const normalizeMaxAttempts = (value) =>
	value === null || value === "unlimited"
		? null
		: Number.parseInt(String(value), 10);

export const normalizeSettings = (input = {}) => {
	const language = LANGUAGE_OPTIONS.includes(input.language)
		? input.language
		: DEFAULT_SETTINGS.language;
	const rawMaxAttempts = Object.hasOwn(input, "maxAttempts")
		? input.maxAttempts
		: DEFAULT_SETTINGS.maxAttempts;
	const maxAttemptsValue = normalizeMaxAttempts(rawMaxAttempts);
	const maxAttempts = MAX_ATTEMPTS_OPTIONS.includes(maxAttemptsValue)
		? maxAttemptsValue
		: DEFAULT_SETTINGS.maxAttempts;
	const directFeedback = normalizeBool(
		input.directFeedback,
		DEFAULT_SETTINGS.directFeedback,
	);
	const indirectFeedback = normalizeBool(
		input.indirectFeedback,
		DEFAULT_SETTINGS.indirectFeedback,
	);

	return { language, maxAttempts, directFeedback, indirectFeedback };
};

export const formatDuration = (seconds) => {
	if (!Number.isFinite(seconds) || seconds < 0) return "-";
	const minutes = Math.floor(seconds / 60);
	return `${minutes}:${pad2(seconds % 60)}`;
};
