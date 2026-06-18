import { describe, expect, it } from "vitest";
import { parsePrefixes } from "./parse-prefixes";

describe("parsePrefixes", () => {
	it("returns a single prefix", () => {
		expect(parsePrefixes("ms")).toEqual(["ms"]);
	});

	it("splits multiple comma-separated prefixes", () => {
		expect(parsePrefixes("ms,snippet")).toEqual(["ms", "snippet"]);
	});

	it("trims whitespace around each prefix", () => {
		expect(parsePrefixes("  ms  ,  snippet  ")).toEqual(["ms", "snippet"]);
	});

	it("filters the empty entry from a trailing comma", () => {
		expect(parsePrefixes("ms,")).toEqual(["ms"]);
	});

	it("filters entries that are only whitespace", () => {
		expect(parsePrefixes("ms,  ,snippet")).toEqual(["ms", "snippet"]);
	});

	it("returns an empty array for an empty string", () => {
		expect(parsePrefixes("")).toEqual([]);
	});

	it("returns an empty array for a whitespace-only string", () => {
		expect(parsePrefixes("   ")).toEqual([]);
	});
});
