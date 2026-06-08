import { describe, expect, it } from "vitest";
import {
	DE_KEYBOARD_ROWS,
	DEFAULT_SETTINGS,
	EN_KEYBOARD_ROWS,
	formatDuration,
	getKeyboardRows,
	LANGUAGE_OPTIONS,
	MAX_ATTEMPTS_OPTIONS,
	mulberry32,
	normalizeSettings,
	shuffle,
	WORD_LENGTH,
} from "../../js/common.js";

describe("common configuration", () => {
	it("exposes correct option ranges", () => {
		expect(WORD_LENGTH).toBe(5);
		expect(LANGUAGE_OPTIONS).toEqual(["en", "de"]);
		expect(MAX_ATTEMPTS_OPTIONS).toEqual([6, 8, 10, null]);
		expect(DEFAULT_SETTINGS).toEqual({
			language: "en",
			maxAttempts: 6,
			directFeedback: true,
			indirectFeedback: false,
		});
	});

	it("normalizes invalid settings back to defaults", () => {
		expect(
			normalizeSettings({
				language: "fr",
				maxAttempts: 99,
				directFeedback: "maybe",
				indirectFeedback: 42,
			}),
		).toEqual(DEFAULT_SETTINGS);
	});

	it("normalizes unlimited and boolean settings", () => {
		expect(
			normalizeSettings({
				language: "de",
				maxAttempts: "unlimited",
				directFeedback: false,
				indirectFeedback: true,
			}),
		).toEqual({
			language: "de",
			maxAttempts: null,
			directFeedback: false,
			indirectFeedback: true,
		});
	});

	it("handles boolean string values", () => {
		expect(
			normalizeSettings({ directFeedback: "true", indirectFeedback: "false" }),
		).toMatchObject({ directFeedback: true, indirectFeedback: false });
	});
});

describe("keyboard layouts", () => {
	it("EN keyboard has 3 rows with no umlauts", () => {
		expect(EN_KEYBOARD_ROWS).toHaveLength(3);
		const all = EN_KEYBOARD_ROWS.flat();
		expect(all).not.toContain("Ä");
		expect(all).not.toContain("Ö");
		expect(all).not.toContain("Ü");
		expect(all).toContain("ENTER");
		expect(all).toContain("BACK");
	});

	it("DE keyboard has 3 rows with Ä, Ö, Ü and ß", () => {
		expect(DE_KEYBOARD_ROWS).toHaveLength(3);
		const all = DE_KEYBOARD_ROWS.flat();
		expect(all).toContain("Ä");
		expect(all).toContain("Ö");
		expect(all).toContain("Ü");
		expect(all).toContain("ß");
		expect(all).toContain("ENTER");
		expect(all).toContain("BACK");
	});

	it("DE keyboard uses QWERTZ layout (Z in row 1, Y in row 3)", () => {
		expect(DE_KEYBOARD_ROWS[0]).toContain("Z");
		expect(DE_KEYBOARD_ROWS[2]).toContain("Y");
	});

	it("EN keyboard uses QWERTY layout (Y in row 1, Z in row 3)", () => {
		expect(EN_KEYBOARD_ROWS[0]).toContain("Y");
		expect(EN_KEYBOARD_ROWS[2]).toContain("Z");
	});

	it("getKeyboardRows returns DE for de, EN for en and unknown", () => {
		expect(getKeyboardRows("de")).toBe(DE_KEYBOARD_ROWS);
		expect(getKeyboardRows("en")).toBe(EN_KEYBOARD_ROWS);
		expect(getKeyboardRows("fr")).toBe(EN_KEYBOARD_ROWS);
	});
});

describe("mulberry32", () => {
	it("produces deterministic sequence for same seed", () => {
		const a = mulberry32(123456);
		const b = mulberry32(123456);
		expect([a(), a(), a(), a()]).toEqual([b(), b(), b(), b()]);
	});

	it("produces values in [0, 1)", () => {
		const rnd = mulberry32(77);
		for (let i = 0; i < 25; i++) {
			const v = rnd();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});
});

describe("shuffle", () => {
	it("returns new array with same values", () => {
		const data = [1, 2, 3, 4, 5];
		const out = shuffle(data, mulberry32(5));
		expect(out).not.toBe(data);
		expect([...out].sort((a, b) => a - b)).toEqual(data);
	});
});

describe("formatDuration", () => {
	it("formats seconds to m:ss", () => {
		expect(formatDuration(0)).toBe("0:00");
		expect(formatDuration(65)).toBe("1:05");
		expect(formatDuration(3600)).toBe("60:00");
	});

	it("returns dash for negative or non-finite values", () => {
		expect(formatDuration(-1)).toBe("-");
		expect(formatDuration(Number.NaN)).toBe("-");
		expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("-");
	});
});
