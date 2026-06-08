// Copyright (c) 2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

/**
 * Create a reactive store.
 *
 * @template S
 * @param {(state: S, action: Object) => S} reducer  - Pure state-transition function.
 * @param {S} initialState                           - Starting state.
 * @returns {{ getState, dispatch, subscribe }}
 */
export const createStore = (reducer, initialState) => {
	let state = initialState;
	const listeners = new Set();

	const getState = () => state;

	const dispatch = (action) => {
		state = reducer(state, action);
		listeners.forEach((fn) => {
			fn(state, action);
		});
	};

	/** Subscribe to every state change.  Returns an unsubscribe function. */
	const subscribe = (fn) => {
		listeners.add(fn);
		return () => listeners.delete(fn);
	};

	return { getState, dispatch, subscribe };
};

export const Actions = Object.freeze({
	NAVIGATE: "NAVIGATE",
	ENGINE_BOARD_UPDATE: "ENGINE_BOARD_UPDATE",
	HUMAN_TURN_READY: "HUMAN_TURN_READY",
	SETTINGS_CHANGE: "SETTINGS_CHANGE",
	NEW_GAME: "NEW_GAME",
});

export const initialAppState = {
	view: "game",
	board: null,
	phase: "idle",
	settings: {
		language: "en",
		maxAttempts: 6,
		directFeedback: true,
		indirectFeedback: false,
	},
};

export const appReducer = (state, action) => {
	if (!action || typeof action !== "object") {
		return state;
	}

	if (
		typeof process !== "undefined" &&
		process.env.NODE_ENV !== "production" &&
		!(action.type in Actions)
	) {
		console.warn(
			`Unknown action type: ${action.type}. Valid types are:`,
			Object.keys(Actions),
		);
	}
	switch (action.type) {
		case Actions.NAVIGATE:
			return { ...state, view: action.view };

		case Actions.ENGINE_BOARD_UPDATE:
			return { ...state, board: action.board, phase: "idle" };

		case Actions.HUMAN_TURN_READY:
			return {
				...state,
				board: action.board,
				phase: "human_turn",
			};

		case Actions.SETTINGS_CHANGE:
			return { ...state, settings: { ...state.settings, ...action.settings } };

		case Actions.NEW_GAME:
			return {
				...state,
				phase: "idle",
			};

		default:
			return state;
	}
};
