// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

import { applyAction, Board, createBoard, markInvalidWord } from "./board.js";
import { DEFAULT_SETTINGS, normalizeSettings } from "./common.js";

let settings = DEFAULT_SETTINGS;
let board = new Board(createBoard({ settings }));
let wordList = [];
let wordSet = new Set();

const WORD_LIST_URLS = {
	en: "../data/en_5_letters.txt",
	de: "../data/de_5_letters.txt",
};

// Uppercase every character except ß (which would become SS otherwise)
const normalizeWordChar = (ch) => (ch === "ß" ? "ß" : ch.toUpperCase());
const normalizeWord = (w) =>
	Array.from(w.trim()).map(normalizeWordChar).join("");

const loadWordList = async (language) => {
	const url = WORD_LIST_URLS[language] ?? WORD_LIST_URLS.en;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch word list: ${url} (${response.status})`);
	}
	const text = await response.text();
	return text
		.trim()
		.split("\n")
		.map(normalizeWord)
		.filter((w) => w.length === 5);
};

const snapshot = () => ({ board: board.getState() });

const postState = (request) => {
	self.postMessage({
		eventClass: "request",
		request,
		...snapshot(),
	});
};

const postTurnReady = () => {
	postState("redraw");
	postState("human_to_move");
};

const applySettings = (payload = {}) => {
	settings = normalizeSettings({ ...settings, ...payload });
	return settings;
};

const restart = async (payload = {}) => {
	const prevLanguage = settings.language;
	applySettings(payload);
	if (wordList.length === 0 || settings.language !== prevLanguage) {
		wordList = await loadWordList(settings.language);
		wordSet = new Set(wordList);
	}
	board = new Board(createBoard({ settings, wordList }));
	postTurnReady();
};

const move = (action, payload = {}) => {
	applySettings(payload);

	if (action && action.type === "submit") {
		const state = board.getState();
		if (state.currentGuess.length === 5) {
			const currentGuess = state.currentGuess.join("");
			if (!wordSet.has(currentGuess)) {
				board.setState(markInvalidWord(board.getState()));
				postState("redraw");
				postState("invalid_word");
				return;
			}
		}
	}

	board.setState(applyAction(board.getState(), action));
	postTurnReady();
};

const sync = (payload = {}) => {
	applySettings(payload);
	postTurnReady();
};

const handlers = Object.freeze({
	start: ({ settings: payload }) =>
		restart(payload).catch((err) =>
			console.error("Word list load failed:", err),
		),
	restart: ({ settings: payload }) =>
		restart(payload).catch((err) =>
			console.error("Word list load failed:", err),
		),
	move: ({ settings: payload, action }) => move(action, payload),
	sync: ({ settings: payload }) => sync(payload),
	action_by_ai: ({ settings: payload }) => sync(payload),
});

self.addEventListener("message", ({ data }) => {
	const handler = handlers[data.request];
	if (handler) {
		handler(data);
	}
});
