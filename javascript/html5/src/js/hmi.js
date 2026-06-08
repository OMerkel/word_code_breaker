// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

import { getHighscoreEntry } from "./board.js";
import {
	formatDuration,
	getKeyboardRows,
	normalizeSettings,
} from "./common.js";
import { startFireworks, stopFireworks } from "./fireworks.js";
import { createRenderer } from "./renderer.js";
import { Actions, appReducer, createStore, initialAppState } from "./store.js";

const SETTINGS_STORAGE_KEY = "wordcodebreaker_settings";
const HIGHSCORE_STORAGE_KEY = "wordcodebreaker_highscores";
const sections = ["game", "rules", "options", "about"];
const store = createStore(appReducer, initialAppState);
const engine = new Worker("js/controller.js", { type: "module" });

const translations = {
	en: {
		tagline: "Guess the 5-letter word before the attempts run out.",
		rulesTitle: "Rules",
		rulesIntro:
			"Guess the hidden 5-letter word. Each attempt must be a valid word from the dictionary.",
		rulesGoalTitle: "Goal",
		rulesGoalBody:
			"Find the secret word within the configured attempt limit. Each guess must be a valid 5-letter word.",
		rulesFeedbackTitle: "Direct Feedback",
		rulesFeedbackBody:
			"Green: letter is in the correct position. Yellow: letter is in the word but wrong position. Grey: letter is not in the word.",
		rulesIndirectTitle: "Indirect Feedback",
		rulesIndirectBody:
			"Shows the total count of correctly placed and included (but misplaced) letters as a number.",
		rulesOptionsTitle: "Configurable Options",
		rulesOptionsAttempts: "Maximum attempts can be 6, 8, 10, or unlimited.",
		rulesOptionsFeedback:
			"Direct and indirect feedback can be toggled independently.",
		rulesOptionsLanguage:
			"Language: English uses a standard A-Z keyboard. German uses QWERTZ with Ä, Ö, Ü.",
		rulesOutcomeTitle: "Outcomes",
		rulesOutcomeBody:
			"Solving triggers a celebration animation. Running out of attempts reveals the secret word.",
		optionsTitle: "Options",
		optionsHint:
			"Changes are applied when you start a New Game. Language changes reload the word list.",
		optionsAttempts: "Maximum Attempts",
		optionsLanguage: "Language",
		optionsFeedback: "Feedback",
		optionsDirectFeedback: "Direct Feedback (color per letter)",
		optionsIndirectFeedback: "Indirect Feedback (count badges)",
		optionsBothFeedback: "Both (Direct and Indirect)",
		optionsHighscores: "Highscores",
		attemptsUnlimited: "Unlimited",
		aboutTitle: "About Word Code Breaker",
		aboutSummary:
			"A browser-first deductive word puzzle with EN/DE dictionaries, persistent highscores, and offline-ready packaging.",
		aboutLicense:
			"All source code in this edition is released under the MIT License.",
		aboutRuntime: "This implementation uses no third-party runtime libraries.",
		menuClose: "Close",
		menuNew: "New Game",
		menuRules: "Rules...",
		menuOptions: "Options...",
		menuAbout: "About...",
		back: "Back",
		ok: "OK",
		resetToday: "Reset Today",
		resetWeek: "Reset Week",
		resetMonth: "Reset Month",
		scoreToday: "Today",
		scoreWeek: "Week",
		scoreMonth: "Month",
		gameEyebrow: "Word Puzzle",
		gameTitle: "Word Code Breaker",
		metricLanguage: "Language",
		metricAttempts: "Attempts",
		metricTime: "Time",
		statusCardTitle: "Status",
		unlimitedValue: "Unlimited",
		confirmReset: "Are you sure?",
		highscoreNone: "-",
		highscoreFormat: (entry) =>
			`${entry.attempts} tries / ${formatDuration(entry.seconds)}`,
		loading: "Loading word list...",
		statusBody: (board) => {
			if (board.status === "won")
				return `You found the word. Start a new game for another challenge.`;
			if (board.status === "lost")
				return `No attempts left. The word was ${board.secret.join("")}.`;
			if (board.invalidWord) return "Not in word list. Try another word.";
			if (board.canSubmit) return "Word complete – press Enter to submit.";
			return `Enter ${5 - board.currentGuess.length} more letter${5 - board.currentGuess.length === 1 ? "" : "s"}.`;
		},
	},
	de: {
		tagline:
			"Errate das 5-Buchstaben-Wort, bevor die Versuche aufgebraucht sind.",
		rulesTitle: "Regeln",
		rulesIntro:
			"Errate das versteckte 5-Buchstaben-Wort. Jeder Versuch muss ein gültiges Wort aus dem Wörterbuch sein.",
		rulesGoalTitle: "Ziel",
		rulesGoalBody:
			"Finde das geheime Wort innerhalb der eingestellten maximalen Versuchsanzahl. Jeder Tipp muss ein gültiges 5-Buchstaben-Wort sein.",
		rulesFeedbackTitle: "Direktes Feedback",
		rulesFeedbackBody:
			"Grün: Buchstabe ist an der richtigen Stelle. Gelb: Buchstabe ist im Wort, aber an falscher Stelle. Grau: Buchstabe ist nicht im Wort.",
		rulesIndirectTitle: "Indirektes Feedback",
		rulesIndirectBody:
			"Zeigt die Gesamtanzahl der korrekt platzierten und vorhandenen (aber falsch platzierten) Buchstaben als Zahl an.",
		rulesOptionsTitle: "Optionen",
		rulesOptionsAttempts: "Maximale Versuche: 6, 8, 10 oder unbegrenzt.",
		rulesOptionsFeedback:
			"Direktes und indirektes Feedback können unabhängig voneinander ein- oder ausgeschaltet werden.",
		rulesOptionsLanguage:
			"Sprache: Englisch verwendet eine Standard A-Z-Tastatur. Deutsch verwendet QWERTZ mit Ä, Ö, Ü.",
		rulesOutcomeTitle: "Ergebnis",
		rulesOutcomeBody:
			"Das Lösen löst eine Feieranimation aus. Wenn die Versuche aufgebraucht sind, wird das geheime Wort aufgedeckt.",
		optionsTitle: "Optionen",
		optionsHint:
			"Änderungen werden beim Start eines neuen Spiels übernommen. Sprachwechsel laden die Wortliste neu.",
		optionsAttempts: "Maximale Versuche",
		optionsLanguage: "Sprache",
		optionsFeedback: "Feedback",
		optionsDirectFeedback: "Direktes Feedback (Farbe je Buchstabe)",
		optionsIndirectFeedback: "Indirektes Feedback (Anzahl-Badges)",
		optionsBothFeedback: "Beide (Direktes und indirektes Feedback)",
		optionsHighscores: "Bestwerte",
		attemptsUnlimited: "Unbegrenzt",
		aboutTitle: "Über Word Code Breaker",
		aboutSummary:
			"Ein browserbasiertes Wörter-Deduktionsspiel mit EN/DE-Wörterbüchern, dauerhaften Bestwerten und Offline-Unterstützung.",
		aboutLicense:
			"Der gesamte Quellcode dieser Ausgabe steht unter der MIT-Lizenz.",
		aboutRuntime:
			"Diese Implementierung verwendet keine Drittanbieter-Laufzeitbibliotheken.",
		menuClose: "Schließen",
		menuNew: "Neues Spiel",
		menuRules: "Regeln...",
		menuOptions: "Optionen...",
		menuAbout: "Über...",
		back: "Zurück",
		ok: "OK",
		resetToday: "Heute löschen",
		resetWeek: "Woche löschen",
		resetMonth: "Monat löschen",
		scoreToday: "Heute",
		scoreWeek: "Woche",
		scoreMonth: "Monat",
		gameEyebrow: "Wörterrätsel",
		gameTitle: "Word Code Breaker",
		metricLanguage: "Sprache",
		metricAttempts: "Versuche",
		metricTime: "Zeit",
		statusCardTitle: "Status",
		unlimitedValue: "Unbegrenzt",
		confirmReset: "Sind Sie sicher?",
		highscoreNone: "-",
		highscoreFormat: (entry) =>
			`${entry.attempts} Versuche / ${formatDuration(entry.seconds)}`,
		loading: "Wortliste wird geladen...",
		statusBody: (board) => {
			if (board.status === "won")
				return `Wort gefunden! Starte ein neues Spiel für eine neue Herausforderung.`;
			if (board.status === "lost")
				return `Keine Versuche mehr. Das Wort war ${board.secret.join("")}.`;
			if (board.invalidWord)
				return "Nicht im Wörterbuch. Versuche ein anderes Wort.";
			if (board.canSubmit)
				return "Wort vollständig – Enter drücken zum Absenden.";
			return `Noch ${5 - board.currentGuess.length} Buchstabe${5 - board.currentGuess.length === 1 ? "" : "n"} eingeben.`;
		},
	},
};

const getTexts = (language) => ({
	...translations.en,
	...(translations[language] ?? {}),
});

const renderer = createRenderer(document.getElementById("board"), (action) => {
	sendToEngine("move", { action });
});

const pad2 = (value) => String(value).padStart(2, "0");
const getTodayKey = (date = new Date()) =>
	`${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const getMonthKey = (date = new Date()) =>
	`${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
const getWeekKey = (date = new Date()) => {
	const utcDate = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	);
	const day = utcDate.getUTCDay() || 7;
	utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
	const week = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
	return `${utcDate.getUTCFullYear()}-W${pad2(week)}`;
};

const emptyScores = () => ({
	today: { period: "", entries: {} },
	week: { period: "", entries: {} },
	month: { period: "", entries: {} },
});

const normalizeScoreEntry = (entry) => {
	if (!entry || typeof entry !== "object") return null;
	if (!Number.isInteger(entry.attempts) || !Number.isInteger(entry.seconds))
		return null;
	return {
		attempts: entry.attempts,
		seconds: entry.seconds,
		label: typeof entry.label === "string" ? entry.label : "",
	};
};

const normalizeScores = (value) => {
	const base = emptyScores();
	if (!value || typeof value !== "object") return base;
	for (const period of ["today", "week", "month"]) {
		const item = value[period];
		if (!item || typeof item !== "object") continue;
		base[period].period = typeof item.period === "string" ? item.period : "";
		if (item.entries && typeof item.entries === "object") {
			for (const [key, entry] of Object.entries(item.entries)) {
				const normalized = normalizeScoreEntry(entry);
				if (normalized) {
					base[period].entries[key] = normalized;
				}
			}
		}
	}
	return base;
};

const refreshScorePeriods = (scores) => {
	const next = normalizeScores(scores);
	const now = new Date();
	const periods = {
		today: getTodayKey(now),
		week: getWeekKey(now),
		month: getMonthKey(now),
	};
	for (const period of ["today", "week", "month"]) {
		if (next[period].period !== periods[period]) {
			next[period] = { period: periods[period], entries: {} };
		}
	}
	return next;
};

const configKey = (settings) =>
	`${settings.language}-${settings.maxAttempts ?? "u"}`;

const formatMaxAttempts = (maxAttempts) =>
	maxAttempts === null ? "\u221e" : String(maxAttempts);

const configLabel = (settings, board = null) => {
	const language = settings.language.toUpperCase();
	const maxAttempts = formatMaxAttempts(settings.maxAttempts);
	const attemptNumber = board
		? board.status === "playing"
			? board.attemptsUsed + 1
			: board.attemptsUsed
		: 1;
	const attempts = board
		? `${attemptNumber}/${maxAttempts}`
		: `1/${maxAttempts}`;
	const elapsed = board?.firstInputAt
		? formatDuration(
				Math.max(
					Math.floor(
						((board.finishedAt ?? Date.now()) - board.firstInputAt) / 1000,
					),
					0,
				),
			)
		: formatDuration(0);
	return `${language} | ${attempts} | ${elapsed}`;
};

const isBetterScore = (candidate, current) => {
	if (!current) return true;
	if (candidate.attempts !== current.attempts)
		return candidate.attempts < current.attempts;
	return candidate.seconds < current.seconds;
};

const loadScores = () => {
	try {
		const raw = localStorage.getItem(HIGHSCORE_STORAGE_KEY);
		return refreshScorePeriods(raw ? JSON.parse(raw) : emptyScores());
	} catch (error) {
		console.warn("Failed to load highscores from localStorage:", error);
		return refreshScorePeriods(emptyScores());
	}
};

const saveScores = (scores) => {
	try {
		localStorage.setItem(HIGHSCORE_STORAGE_KEY, JSON.stringify(scores));
	} catch (error) {
		console.warn("Failed to save highscores to localStorage:", error);
	}
};

let scoreState = loadScores();

const getScores = () => {
	const previousPeriods = {
		today: scoreState.today.period,
		week: scoreState.week.period,
		month: scoreState.month.period,
	};
	scoreState = refreshScorePeriods(scoreState);
	const periodChanged =
		scoreState.today.period !== previousPeriods.today ||
		scoreState.week.period !== previousPeriods.week ||
		scoreState.month.period !== previousPeriods.month;
	if (periodChanged) {
		saveScores(scoreState);
	}
	return scoreState;
};

const saveSettingsToStorage = () => {
	try {
		localStorage.setItem(
			SETTINGS_STORAGE_KEY,
			JSON.stringify(store.getState().settings),
		);
	} catch (error) {
		console.warn("Failed to save settings to localStorage:", error);
	}
};

const restoreSettingsFromStorage = () => {
	try {
		const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (!raw) return null;
		return normalizeSettings(JSON.parse(raw));
	} catch (error) {
		console.warn("Failed to restore settings from localStorage:", error);
		return null;
	}
};

const readSettings = () => {
	const feedbackMode =
		document.querySelector('input[name="feedbackMode"]:checked')?.value ??
		"both";
	return normalizeSettings({
		language: document.querySelector('input[name="language"]:checked')?.value,
		maxAttempts: document.querySelector('input[name="maxAttempts"]:checked')
			?.value,
		directFeedback: feedbackMode === "direct" || feedbackMode === "both",
		indirectFeedback: feedbackMode === "indirect" || feedbackMode === "both",
	});
};

const applySettingsToForm = (settings) => {
	const setChecked = (name, value) => {
		const input = document.querySelector(
			`input[name="${name}"][value="${value}"]`,
		);
		if (input) input.checked = true;
	};
	const feedbackMode =
		settings.directFeedback && settings.indirectFeedback
			? "both"
			: settings.directFeedback
				? "direct"
				: "indirect";
	setChecked("language", settings.language);
	setChecked(
		"maxAttempts",
		settings.maxAttempts === null ? "unlimited" : String(settings.maxAttempts),
	);
	setChecked("feedbackMode", feedbackMode);
};

const updateHeaderBadge = (settings, board = null) => {
	const badge = document.getElementById("app-header-badge");
	if (badge) badge.textContent = configLabel(settings, board);
};

const showView = (view) => {
	sections.forEach((id) => {
		const node = document.getElementById(`view-${id}`);
		if (node) node.hidden = id !== view;
	});
};

const setText = (id, text) => {
	const node = document.getElementById(id);
	if (node) node.textContent = text;
};

const translateStaticText = (settings) => {
	const texts = getTexts(settings.language);
	document.documentElement.lang = settings.language;
	setText("app-header-title", "Word Code Breaker");
	setText("app-header-subtitle", texts.tagline);
	setText("btn-panel-close", texts.menuClose);
	setText("nav-new", texts.menuNew);
	setText("nav-rules", texts.menuRules);
	setText("nav-options", texts.menuOptions);
	setText("nav-about", texts.menuAbout);
	setText("btn-options-ok", texts.ok);
	document.querySelectorAll("[data-nav-back='game']").forEach((node) => {
		node.textContent = texts.back;
	});
	setText("label-score-today", texts.scoreToday);
	setText("label-score-week", texts.scoreWeek);
	setText("label-score-month", texts.scoreMonth);
	setText("label-options-score-today", texts.scoreToday);
	setText("label-options-score-week", texts.scoreWeek);
	setText("label-options-score-month", texts.scoreMonth);
	setText("btn-reset-score-today", texts.resetToday);
	setText("btn-reset-score-week", texts.resetWeek);
	setText("btn-reset-score-month", texts.resetMonth);
	document.querySelectorAll("[data-i18n]").forEach((node) => {
		const key = node.getAttribute("data-i18n");
		if (key && texts[key] && typeof texts[key] === "string") {
			node.textContent = texts[key];
		}
	});
};

const sendToEngine = (request, extra = {}) => {
	engine.postMessage({ request, settings: readSettings(), ...extra });
};

const formatScore = (entry, settings) => {
	const texts = getTexts(settings.language);
	if (!entry) return texts.highscoreNone;
	return texts.highscoreFormat(entry);
};

const renderHighscores = () => {
	const state = store.getState();
	const scores = getScores();
	const key = configKey(state.settings);
	setText(
		"game-score-today",
		formatScore(scores.today.entries[key], state.settings),
	);
	setText(
		"game-score-week",
		formatScore(scores.week.entries[key], state.settings),
	);
	setText(
		"game-score-month",
		formatScore(scores.month.entries[key], state.settings),
	);
	setText(
		"score-today",
		formatScore(scores.today.entries[key], state.settings),
	);
	setText("score-week", formatScore(scores.week.entries[key], state.settings));
	setText(
		"score-month",
		formatScore(scores.month.entries[key], state.settings),
	);
};

const recordCompletedGame = (board) => {
	const entry = getHighscoreEntry(board);
	if (!entry) return;
	const scores = getScores();
	const key = configKey(board.settings);
	const candidate = { ...entry, label: configLabel(board.settings) };
	for (const period of ["today", "week", "month"]) {
		if (isBetterScore(candidate, scores[period].entries[key])) {
			scores[period].entries[key] = candidate;
		}
	}
	scoreState = scores;
	saveScores(scores);
	renderHighscores();
};

const resetHighscore = (period) => {
	const state = store.getState();
	const texts = getTexts(state.settings.language);
	if (!window.confirm(texts.confirmReset)) return;
	const scores = getScores();
	delete scores[period].entries[configKey(state.settings)];
	scoreState = scores;
	saveScores(scores);
	renderHighscores();
};

const closePanel = () => {
	document.getElementById("side-panel").classList.remove("open");
	document.getElementById("panel-overlay").hidden = true;
};

const openPanel = () => {
	document.getElementById("side-panel").classList.add("open");
	document.getElementById("panel-overlay").hidden = false;
};

const renderBoard = () => {
	const state = store.getState();
	const texts = getTexts(state.settings.language);
	const elapsedSeconds = state.board?.firstInputAt
		? formatDuration(
				Math.max(
					Math.floor(
						((state.board.finishedAt ?? Date.now()) -
							state.board.firstInputAt) /
							1000,
					),
					0,
				),
			)
		: formatDuration(0);
	renderer.render(state.board, {
		texts,
		elapsedSeconds,
		settings: state.settings,
	});
};

let previousStatus = null;

store.subscribe((state) => {
	showView(state.view);
	translateStaticText(state.settings);
	updateHeaderBadge(state.settings, state.board);
	renderHighscores();
	renderBoard();
	if (state.board?.status === "won" && previousStatus !== "won") {
		recordCompletedGame(state.board);
		startFireworks(8000);
	}
	previousStatus = state.board?.status ?? null;
});

engine.addEventListener("message", ({ data }) => {
	if (data.request === "redraw") {
		store.dispatch({ type: Actions.ENGINE_BOARD_UPDATE, board: data.board });
	}
	if (data.request === "human_to_move" || data.request === "invalid_word") {
		store.dispatch({ type: Actions.HUMAN_TURN_READY, board: data.board });
	}
});

engine.addEventListener("error", (event) => {
	console.error("Worker crashed:", event.message, event.filename, event.lineno);
});

const bindEvents = () => {
	document.getElementById("btn-menu").addEventListener("click", openPanel);
	document.getElementById("btn-panel-close").addEventListener("click", () => {
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "game" });
	});
	document
		.getElementById("panel-overlay")
		.addEventListener("click", closePanel);
	document.getElementById("nav-rules").addEventListener("click", () => {
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "rules" });
	});
	document.getElementById("nav-options").addEventListener("click", () => {
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "options" });
	});
	document.getElementById("nav-about").addEventListener("click", () => {
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "about" });
	});
	document.getElementById("nav-new").addEventListener("click", () => {
		stopFireworks();
		closePanel();
		store.dispatch({ type: Actions.NAVIGATE, view: "game" });
		store.dispatch({ type: Actions.NEW_GAME });
		sendToEngine("restart");
	});
	document.querySelectorAll("[data-nav-back='game']").forEach((button) => {
		button.addEventListener("click", () => {
			store.dispatch({ type: Actions.NAVIGATE, view: "game" });
		});
	});
	document.getElementById("btn-options-ok").addEventListener("click", () => {
		stopFireworks();
		const settings = readSettings();
		store.dispatch({ type: Actions.SETTINGS_CHANGE, settings });
		saveSettingsToStorage();
		store.dispatch({ type: Actions.NEW_GAME });
		store.dispatch({ type: Actions.NAVIGATE, view: "game" });
		sendToEngine("restart");
	});
	document
		.getElementById("btn-reset-score-today")
		.addEventListener("click", () => resetHighscore("today"));
	document
		.getElementById("btn-reset-score-week")
		.addEventListener("click", () => resetHighscore("week"));
	document
		.getElementById("btn-reset-score-month")
		.addEventListener("click", () => resetHighscore("month"));
	document.getElementById("options-form").addEventListener("change", () => {
		const settings = readSettings();
		store.dispatch({ type: Actions.SETTINGS_CHANGE, settings });
		saveSettingsToStorage();
	});

	// Physical keyboard support (letter keys + Backspace/Enter)
	document.addEventListener("keydown", (event) => {
		if (store.getState().view !== "game") return;
		if (event.key === "Backspace") {
			event.preventDefault();
			sendToEngine("move", { action: { type: "backspace" } });
			return;
		}
		if (event.key === "Enter") {
			event.preventDefault();
			sendToEngine("move", { action: { type: "submit" } });
			return;
		}
		if (event.key.length === 1) {
			// ß must not be uppercased (JS uppercases it to SS)
			const letter = event.key === "ß" ? "ß" : event.key.toUpperCase();
			const settings = store.getState().settings;
			const keyboardLetters = getKeyboardRows(settings.language)
				.flat()
				.filter((k) => k !== "ENTER" && k !== "BACK");
			if (keyboardLetters.includes(letter)) {
				sendToEngine("move", { action: { type: "append", letter } });
			}
		}
	});
};

const registerServiceWorker = () => {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("js/sw.js").catch((error) => {
			console.warn("Service worker registration failed:", error);
		});
	}
};

const initialize = () => {
	const restored = restoreSettingsFromStorage() ?? store.getState().settings;
	store.dispatch({ type: Actions.SETTINGS_CHANGE, settings: restored });
	applySettingsToForm(restored);
	translateStaticText(restored);
	bindEvents();
	renderHighscores();
	renderBoard();
	sendToEngine("start");
	registerServiceWorker();
	window.setInterval(() => {
		if (store.getState().board?.status === "playing") {
			renderBoard();
			updateHeaderBadge(store.getState().settings, store.getState().board);
		}
	}, 1000);
};

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
	initialize();
}

export { restoreSettingsFromStorage, saveSettingsToStorage };
