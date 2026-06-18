import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DuplicateSnippetError, buildSnippetEntry, insertSnippet } from "./insert-snippet";

// ---------------------------------------------------------------------------
// buildSnippetEntry
// ---------------------------------------------------------------------------

describe("buildSnippetEntry", () => {
	it("trims the title", () => {
		const { title } = buildSnippetEntry({ code: "x", mode: "snippet-syntax", prefix: "", title: "  My snippet  " });
		expect(title).toBe("My snippet");
	});

	it("uses a string prefix for a single prefix", () => {
		const { entry } = buildSnippetEntry({ code: "x", mode: "snippet-syntax", prefix: "ms", title: "T" });
		expect(entry.prefix).toBe("ms");
	});

	it("uses an array prefix for multiple prefixes", () => {
		const { entry } = buildSnippetEntry({ code: "x", mode: "snippet-syntax", prefix: "ms, snip", title: "T" });
		expect(entry.prefix).toEqual(["ms", "snip"]);
	});

	it("uses an empty string when no prefix is provided", () => {
		const { entry } = buildSnippetEntry({ code: "x", mode: "snippet-syntax", prefix: "", title: "T" });
		expect(entry.prefix).toBe("");
	});

	it("splits code into body lines", () => {
		const { entry } = buildSnippetEntry({ code: "line one\nline two", mode: "snippet-syntax", prefix: "", title: "T" });
		expect(entry.body).toEqual(["line one", "line two"]);
	});

	it("strips trailing empty lines from body", () => {
		const { entry } = buildSnippetEntry({ code: "hello\n\n", mode: "snippet-syntax", prefix: "", title: "T" });
		expect(entry.body).toEqual(["hello"]);
	});

	it("applies literal escaping to body in literal mode", () => {
		const { entry } = buildSnippetEntry({ code: "$1", mode: "literal", prefix: "", title: "T" });
		expect(entry.body[0]).toBe("\\$1");
	});

	it("omits description when not provided", () => {
		const { entry } = buildSnippetEntry({ code: "x", mode: "snippet-syntax", prefix: "", title: "T" });
		expect(entry.description).toBeUndefined();
	});

	it("omits description when empty", () => {
		const { entry } = buildSnippetEntry({ code: "x", description: "", mode: "snippet-syntax", prefix: "", title: "T" });
		expect(entry.description).toBeUndefined();
	});

	it("includes description when provided", () => {
		const { entry } = buildSnippetEntry({ code: "x", description: "My desc", mode: "snippet-syntax", prefix: "", title: "T" });
		expect(entry.description).toBe("My desc");
	});

	it("trims whitespace from description", () => {
		const { entry } = buildSnippetEntry({ code: "x", description: "  trimmed  ", mode: "snippet-syntax", prefix: "", title: "T" });
		expect(entry.description).toBe("trimmed");
	});
});

// ---------------------------------------------------------------------------
// insertSnippet
// ---------------------------------------------------------------------------

describe("insertSnippet", () => {
	let dir: string;
	let filePath: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "snippet-test-"));
		filePath = join(dir, "test.json");
	});

	afterEach(() => {
		rmSync(dir, { recursive: true });
	});

	function writeFile(content: object) {
		writeFileSync(filePath, JSON.stringify(content, null, "\t") + "\n", "utf-8");
	}

	function readFile(): Record<string, unknown> {
		return JSON.parse(readFileSync(filePath, "utf-8"));
	}

	it("inserts a new snippet into an empty file", () => {
		writeFile({});
		insertSnippet(filePath, "My snippet", { prefix: "ms", body: ["hello"] });
		expect(readFile()).toEqual({ "My snippet": { prefix: "ms", body: ["hello"] } });
	});

	it("sorts top-level keys alphabetically after insertion", () => {
		writeFile({ Zebra: { prefix: "z", body: ["z"] } });
		insertSnippet(filePath, "Alpha", { prefix: "a", body: ["a"] });
		expect(Object.keys(readFile())).toEqual(["Alpha", "Zebra"]);
	});

	it("preserves existing entries", () => {
		writeFile({ Existing: { prefix: "ex", body: ["x"] } });
		insertSnippet(filePath, "New", { prefix: "n", body: ["n"] });
		const result = readFile();
		expect(result["Existing"]).toBeDefined();
		expect(result["New"]).toBeDefined();
	});

	it("throws DuplicateSnippetError when title already exists", () => {
		writeFile({ "My snippet": { prefix: "ms", body: ["old"] } });
		expect(() => insertSnippet(filePath, "My snippet", { prefix: "ms", body: ["new"] })).toThrow(DuplicateSnippetError);
	});

	it("overwrites an existing entry when overwrite is true", () => {
		writeFile({ "My snippet": { prefix: "ms", body: ["old"] } });
		insertSnippet(filePath, "My snippet", { prefix: "ms", body: ["new"] }, true);
		const result = readFile() as { "My snippet": { body: string[] } };
		expect(result["My snippet"].body).toEqual(["new"]);
	});

	it("parses JSONC with trailing commas", () => {
		writeFileSync(filePath, '{\n\t"Existing": { "prefix": "ex", "body": ["x"], },\n}\n', "utf-8");
		insertSnippet(filePath, "New", { prefix: "n", body: ["n"] });
		expect(readFile()["New"]).toBeDefined();
	});

	it("writes a trailing newline", () => {
		writeFile({});
		insertSnippet(filePath, "T", { prefix: "t", body: ["x"] });
		const raw = readFileSync(filePath, "utf-8");
		expect(raw.endsWith("\n")).toBe(true);
	});

	it("includes description in output when provided", () => {
		writeFile({});
		insertSnippet(filePath, "T", { prefix: "t", description: "My desc", body: ["x"] });
		const result = readFile() as { T: { description: string } };
		expect(result["T"].description).toBe("My desc");
	});
});
