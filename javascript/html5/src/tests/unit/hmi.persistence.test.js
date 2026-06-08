import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const getHmiContent = () => {
	const __filename = fileURLToPath(import.meta.url);
	const hmiPath = path.join(path.dirname(__filename), "../../js/hmi.js");
	return readFileSync(hmiPath, "utf8");
};

describe("hmi persistence and highscore wiring", () => {
	it("exports settings persistence functions", () => {
		const content = getHmiContent();
		expect(content).toContain("const saveSettingsToStorage = ()");
		expect(content).toContain("const restoreSettingsFromStorage = ()");
		expect(content).toContain(
			"export { restoreSettingsFromStorage, saveSettingsToStorage }",
		);
	});

	it("uses dedicated settings storage key", () => {
		const content = getHmiContent();
		expect(content).toContain(
			'const SETTINGS_STORAGE_KEY = "wordcodebreaker_settings"',
		);
		expect(content).toContain("localStorage.getItem(SETTINGS_STORAGE_KEY)");
		expect(content).toContain("localStorage.setItem(");
		expect(content).toContain("SETTINGS_STORAGE_KEY,");
	});

	it("contains highscore storage and update functions", () => {
		const content = getHmiContent();
		expect(content).toContain(
			'const HIGHSCORE_STORAGE_KEY = "wordcodebreaker_highscores"',
		);
		expect(content).toContain("const recordCompletedGame = (board) =>");
		expect(content).toContain("const renderHighscores = () =>");
		expect(content).toContain("const resetHighscore = (period) =>");
	});

	it("contains period key helpers for today/week/month", () => {
		const content = getHmiContent();
		expect(content).toContain("const getTodayKey = (date = new Date()) =>");
		expect(content).toContain("const getWeekKey = (date = new Date()) =>");
		expect(content).toContain("const getMonthKey = (date = new Date()) =>");
	});

	it("asks for confirmation before each reset action", () => {
		const content = getHmiContent();
		expect(content).toContain("btn-reset-score-today");
		expect(content).toContain("btn-reset-score-week");
		expect(content).toContain("btn-reset-score-month");
		expect(content).toContain("window.confirm(texts.confirmReset)");
	});

	it("has localStorage error handling in settings and highscore paths", () => {
		const content = getHmiContent();
		expect(content).toContain("Failed to save settings to localStorage");
		expect(content).toContain("Failed to restore settings from localStorage");
		expect(content).toContain("Failed to load highscores from localStorage");
		expect(content).toContain("Failed to save highscores to localStorage");
	});

	it("restarts the engine when options are confirmed", () => {
		const content = getHmiContent();
		expect(content).toContain('sendToEngine("restart")');
	});

	it("handles invalid_word engine response", () => {
		const content = getHmiContent();
		expect(content).toContain('"invalid_word"');
	});

	it("only supports EN and DE translations", () => {
		const content = getHmiContent();
		expect(content).toMatch(/\ben:\s*\{/);
		expect(content).toMatch(/\bde:\s*\{/);
		expect(content).not.toMatch(/\bfr:\s*\{/);
		expect(content).not.toMatch(/\bpt:\s*\{/);
		expect(content).not.toMatch(/\bes:\s*\{/);
		expect(content).not.toMatch(/\bit:\s*\{/);
	});
});
