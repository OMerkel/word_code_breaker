import { afterEach, describe, expect, it, vi } from "vitest";

const defaultSettings = {
	language: "en",
	maxAttempts: 6,
	directFeedback: true,
	indirectFeedback: false,
};

afterEach(() => {
	vi.restoreAllMocks();
	vi.resetModules();
	vi.doUnmock("../../js/board.js");
	delete globalThis.self;
	delete globalThis.fetch;
});

const mockWordListFetch = () => {
	globalThis.fetch = vi.fn().mockResolvedValue({
		ok: true,
		text: async () => "ABOUT\nABOVE\nABUSE\nACTED\nACUTE\n",
	});
};

describe("controller worker message handling", () => {
	it("handles start and emits redraw + human_to_move", async () => {
		const posted = [];
		const listeners = new Map();
		mockWordListFetch();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		await onMessage({ data: { request: "start", settings: defaultSettings } });
		// allow async to settle
		await new Promise((r) => setTimeout(r, 10));

		expect(posted.map((m) => m.request)).toContain("redraw");
		expect(posted.map((m) => m.request)).toContain("human_to_move");
		const redraw = posted.find((m) => m.request === "redraw");
		expect(redraw.board.status).toBe("playing");
		expect(redraw.board.secret).toHaveLength(5);
	});

	it("restarts with DE settings and loads DE word list", async () => {
		const posted = [];
		const listeners = new Map();
		mockWordListFetch();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		await onMessage({
			data: {
				request: "restart",
				settings: { ...defaultSettings, language: "de" },
			},
		});
		await new Promise((r) => setTimeout(r, 10));

		const redraw = posted.find((m) => m.request === "redraw");
		expect(redraw.board.settings.language).toBe("de");
		// DE keyboard has umlauts
		const allKeys = redraw.board.keyboardRows.flat();
		expect(allKeys).toContain("Ä");
	});

	it("sync keeps board and emits turn-ready snapshot", async () => {
		const posted = [];
		const listeners = new Map();
		mockWordListFetch();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		await onMessage({ data: { request: "start", settings: defaultSettings } });
		await new Promise((r) => setTimeout(r, 10));
		posted.length = 0;

		onMessage({ data: { request: "sync", settings: defaultSettings } });

		expect(posted.map((m) => m.request)).toEqual(["redraw", "human_to_move"]);
	});

	it("append letter advances currentGuess", async () => {
		const posted = [];
		const listeners = new Map();
		mockWordListFetch();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		await onMessage({ data: { request: "start", settings: defaultSettings } });
		await new Promise((r) => setTimeout(r, 10));
		posted.length = 0;

		onMessage({
			data: {
				request: "move",
				settings: defaultSettings,
				action: { type: "append", letter: "A" },
			},
		});

		const redraw = posted.find((m) => m.request === "redraw");
		expect(redraw.board.currentGuess).toEqual(["A"]);
	});

	it("invalid word triggers invalid_word response", async () => {
		const posted = [];
		const listeners = new Map();
		mockWordListFetch();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		await onMessage({ data: { request: "start", settings: defaultSettings } });
		await new Promise((r) => setTimeout(r, 10));
		posted.length = 0;

		// Type a word not in the list
		for (const letter of ["Z", "Z", "Z", "Z", "Z"]) {
			onMessage({
				data: {
					request: "move",
					settings: defaultSettings,
					action: { type: "append", letter },
				},
			});
		}
		posted.length = 0;

		onMessage({
			data: {
				request: "move",
				settings: defaultSettings,
				action: { type: "submit" },
			},
		});

		expect(posted.map((m) => m.request)).toContain("invalid_word");
		const inv = posted.find((m) => m.request === "invalid_word");
		expect(inv.board.invalidWord).toBe(true);
	});

	it("action_by_ai is a compatibility no-op that emits redraw", async () => {
		const posted = [];
		const listeners = new Map();
		mockWordListFetch();

		globalThis.self = {
			postMessage: vi.fn((msg) => posted.push(msg)),
			addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
		};

		await import("../../js/controller.js");
		const onMessage = listeners.get("message");

		await onMessage({ data: { request: "start", settings: defaultSettings } });
		await new Promise((r) => setTimeout(r, 10));
		posted.length = 0;

		onMessage({ data: { request: "action_by_ai", settings: defaultSettings } });
		expect(posted.map((m) => m.request)).toEqual(["redraw", "human_to_move"]);
	});
});
