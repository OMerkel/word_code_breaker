// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

const escapeHtml = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const countFeedback = (feedback = []) => {
	const exact = feedback.filter((state) => state === "correct").length;
	const misplaced = feedback.filter((state) => state === "present").length;
	return { exact, misplaced };
};

const renderTileLetter = (letter) => {
	if (letter === "ß") return '<span class="letter-lowercase">ß</span>';
	return escapeHtml(letter);
};

// ---- Attempt grid ----------------------------------------------------------

const renderHistoryRow = (entry, settings) => {
	const tiles = entry.guess
		.map((letter, i) => {
			const feedbackClass = settings.directFeedback
				? ` tile-${entry.feedback[i]}`
				: " tile-done";
			return `<div class="tile${feedbackClass}">${renderTileLetter(letter)}</div>`;
		})
		.join("");
	const { exact, misplaced } = countFeedback(entry.feedback);
	const badge = settings.indirectFeedback
		? `<div class="feedback-badges"><span class="feedback-badge feedback-badge-exact">exact ${exact}</span><span class="feedback-badge feedback-badge-misplaced">misplaced ${misplaced}</span></div>`
		: "";
	return `<div class="attempt-row attempt-row--done">${tiles}${badge}</div>`;
};

const renderCurrentRow = (board) => {
	const isShaking = board.invalidWord;
	const isFull = board.currentGuess.length === 5;
	const tiles = Array.from({ length: 5 }, (_, i) => {
		const letter = board.currentGuess[i];
		if (letter)
			return `<div class="tile tile-filled">${renderTileLetter(letter)}</div>`;
		if (!isFull && i === board.currentGuess.length)
			return `<div class="tile tile-cursor"></div>`;
		return `<div class="tile tile-empty"></div>`;
	}).join("");
	const shakeClass = isShaking ? " attempt-row--shake" : "";
	return `<div class="attempt-row attempt-row--current${shakeClass}">${tiles}</div>`;
};

const renderEmptyRow = () => {
	const tiles = Array.from(
		{ length: 5 },
		() => `<div class="tile tile-empty"></div>`,
	).join("");
	return `<div class="attempt-row attempt-row--empty">${tiles}</div>`;
};

const renderAttemptGrid = (board, settings) => {
	const rows = [];

	for (const entry of board.history) {
		rows.push(renderHistoryRow(entry, settings));
	}

	if (board.status === "playing") {
		rows.push(renderCurrentRow(board));
	}

	const maxAttempts = board.settings.maxAttempts;
	if (maxAttempts !== null) {
		const filled = board.history.length + (board.status === "playing" ? 1 : 0);
		const emptyCount = maxAttempts - filled;
		for (let i = 0; i < emptyCount; i++) {
			rows.push(renderEmptyRow());
		}
	}

	return `<div class="attempt-grid">${rows.join("")}</div>`;
};

// ---- On-screen keyboard ----------------------------------------------------

const resolveKeyboardClass = (state, settings) => {
	if (state === "unused") return "key-unused";
	if (!settings.directFeedback) return "key-used";
	if (state === "correct") return "key-correct";
	if (state === "present") return "key-present";
	return "key-used";
};

const renderKey = (key, letterStates, settings, enabled) => {
	if (key === "ENTER") {
		return `<button class="key key-action" type="button" data-input-action="submit"${enabled ? "" : " disabled"}>↵</button>`;
	}
	if (key === "BACK") {
		return `<button class="key key-action" type="button" data-input-action="backspace"${enabled ? "" : " disabled"}>⌫</button>`;
	}
	const state = letterStates[key] ?? "unused";
	const keyClass = resolveKeyboardClass(state, settings);
	const safeKey = escapeHtml(key);
	return `<button class="key key-letter ${keyClass}" type="button" data-input-action="append" data-letter="${safeKey}"${enabled ? "" : " disabled"}>${safeKey}</button>`;
};

const renderKeyboard = (keyboardRows, letterStates, settings, enabled) => {
	const rows = keyboardRows
		.map(
			(row) =>
				`<div class="keyboard-row">${row.map((k) => renderKey(k, letterStates, settings, enabled)).join("")}</div>`,
		)
		.join("");
	return `<div class="keyboard">${rows}</div>`;
};

// ---- Main render -----------------------------------------------------------

export const createRenderer = (root, onAction) => {
	root.addEventListener("click", (event) => {
		const button = event.target.closest("[data-input-action]");
		if (!button) return;
		const type = button.getAttribute("data-input-action");
		const letter = button.getAttribute("data-letter");
		if (type === "append" && letter) {
			onAction({ type: "append", letter });
		} else {
			onAction({ type });
		}
	});

	const render = (board, viewModel) => {
		if (!board) {
			root.innerHTML = `<div class="board-loading"><p class="status-message">${escapeHtml(viewModel.texts.loading)}</p></div>`;
			const statusEl = document.getElementById("game-status");
			if (statusEl) statusEl.innerHTML = "";
			return;
		}

		const { texts, settings } = viewModel;
		const keypadEnabled = board.status === "playing";

		root.innerHTML = `
<div class="word-game-layout">
<div class="board-area">
${renderAttemptGrid(board, settings)}
</div>
<div class="keyboard-area">
${renderKeyboard(board.keyboardRows, board.letterStates, settings, keypadEnabled)}
</div>
</div>
`;

		const statusEl = document.getElementById("game-status");
		if (statusEl) {
			statusEl.innerHTML = `
<h2 class="card-title">${escapeHtml(texts.statusCardTitle)}</h2>
<p class="status-message">${escapeHtml(texts.statusBody(board))}</p>
`;
		}
	};

	return { render };
};
