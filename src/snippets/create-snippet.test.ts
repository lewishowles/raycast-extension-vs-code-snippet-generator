import { describe, expect, it } from "vitest";
import { createSnippet } from "./create-snippet";

describe("createSnippet", () => {
	describe("Valid input", () => {
		it("produces a correctly structured snippet entry", () => {
			const result = createSnippet({ code: "hello", mode: "snippet-syntax", prefix: "ms", title: "My snippet" });

			const expected = [
				'"My snippet": {',
				'\t"prefix": "ms",',
				'\t"body": [',
				'\t\t"hello",',
				'\t],',
				"},",
			].join("\n");

			expect(result).toBe(expected);
		});

		it("trims leading and trailing whitespace from the title", () => {
			const result = createSnippet({ code: "x", mode: "snippet-syntax", prefix: "", title: "  trimmed  " });
			expect(result).toContain('"trimmed": {');
		});
	});

	describe("Empty and invalid input", () => {
		it("returns an empty string for empty code", () => {
			expect(createSnippet({ code: "", mode: "snippet-syntax", prefix: "ms", title: "T" })).toBe("");
		});

		it("returns an empty string for whitespace-only code", () => {
			expect(createSnippet({ code: "   ", mode: "snippet-syntax", prefix: "ms", title: "T" })).toBe("");
		});
	});

	describe("Title escaping", () => {
		it("escapes double quotes in the title", () => {
			const result = createSnippet({ code: "x", mode: "snippet-syntax", prefix: "", title: 'Say "hi"' });
			expect(result).toContain('"Say \\"hi\\"": {');
		});

		it("escapes backslashes in the title", () => {
			const result = createSnippet({ code: "x", mode: "snippet-syntax", prefix: "", title: "C:\\path" });
			expect(result).toContain('"C:\\\\path": {');
		});
	});

	describe("Prefix handling", () => {
		it("outputs a JSON string for a single prefix", () => {
			const result = createSnippet({ code: "x", mode: "snippet-syntax", prefix: "ms", title: "T" });
			expect(result).toContain('\t"prefix": "ms",');
		});

		it("outputs a JSON array for multiple prefixes", () => {
			const result = createSnippet({ code: "x", mode: "snippet-syntax", prefix: "ms, snippet", title: "T" });
			expect(result).toContain('\t"prefix": ["ms","snippet"],');
		});

		it("outputs an empty string when no prefix is provided", () => {
			const result = createSnippet({ code: "x", mode: "snippet-syntax", prefix: "", title: "T" });
			expect(result).toContain('\t"prefix": "",');
		});
	});

	describe("Description", () => {
		it("omits description field when not provided", () => {
			const result = createSnippet({ code: "hello", mode: "snippet-syntax", prefix: "", title: "T" });
			expect(result).not.toContain('"description"');
		});

		it("omits description field when empty string", () => {
			const result = createSnippet({ code: "hello", description: "", mode: "snippet-syntax", prefix: "", title: "T" });
			expect(result).not.toContain('"description"');
		});

		it("omits description field when whitespace-only", () => {
			const result = createSnippet({ code: "hello", description: "   ", mode: "snippet-syntax", prefix: "", title: "T" });
			expect(result).not.toContain('"description"');
		});

		it("includes description after prefix in snippet-entry", () => {
			const result = createSnippet({ code: "hello", description: "My desc", mode: "snippet-syntax", prefix: "ms", title: "T" });

			const expected = [
				'"T": {',
				'\t"prefix": "ms",',
				'\t"description": "My desc",',
				'\t"body": [',
				'\t\t"hello",',
				'\t],',
				"},",
			].join("\n");

			expect(result).toBe(expected);
		});

		it("includes description after prefix in snippet-object", () => {
			const result = createSnippet({ code: "hello", description: "My desc", mode: "snippet-syntax", outputMode: "snippet-object", prefix: "ms", title: "T" });
			expect(result).toContain('\t"description": "My desc",');
		});

		it("includes description after prefix in snippet-file", () => {
			const result = createSnippet({ code: "hello", description: "My desc", mode: "snippet-syntax", outputMode: "snippet-file", prefix: "ms", title: "T" });
			expect(result).toContain('\t\t"description": "My desc",');
		});

		it("escapes special characters in description", () => {
			const result = createSnippet({ code: "hello", description: 'Say "hi"', mode: "snippet-syntax", prefix: "", title: "T" });
			expect(result).toContain('"description": "Say \\"hi\\""');
		});
	});

	describe("Output modes", () => {
		it("snippet-entry has trailing commas on body lines, body array, and object", () => {
			const result = createSnippet({ code: "hello\nworld", mode: "snippet-syntax", outputMode: "snippet-entry", prefix: "ms", title: "My snippet" });

			const expected = [
				'"My snippet": {',
				'\t"prefix": "ms",',
				'\t"body": [',
				'\t\t"hello",',
				'\t\t"world",',
				'\t],',
				"},",
			].join("\n");

			expect(result).toBe(expected);
		});

		it("snippet-object has no trailing commas", () => {
			const result = createSnippet({ code: "hello\nworld", mode: "snippet-syntax", outputMode: "snippet-object", prefix: "ms", title: "My snippet" });

			const expected = [
				'"My snippet": {',
				'\t"prefix": "ms",',
				'\t"body": [',
				'\t\t"hello",',
				'\t\t"world"',
				'\t]',
				"}",
			].join("\n");

			expect(result).toBe(expected);
		});

		it("snippet-file wraps the entry in a JSON object", () => {
			const result = createSnippet({ code: "hello\nworld", mode: "snippet-syntax", outputMode: "snippet-file", prefix: "ms", title: "My snippet" });

			const expected = [
				"{",
				'\t"My snippet": {',
				'\t\t"prefix": "ms",',
				'\t\t"body": [',
				'\t\t\t"hello",',
				'\t\t\t"world"',
				'\t\t]',
				'\t}',
				"}",
			].join("\n");

			expect(result).toBe(expected);
		});

		it("snippet-object single line body has no trailing comma", () => {
			const result = createSnippet({ code: "hello", mode: "snippet-syntax", outputMode: "snippet-object", prefix: "", title: "T" });
			expect(result).toContain('\t\t"hello"');
			expect(result).not.toContain('\t\t"hello",');
		});

		it("defaults to snippet-entry when outputMode is omitted", () => {
			const withDefault = createSnippet({ code: "hello", mode: "snippet-syntax", prefix: "ms", title: "T" });
			const explicit = createSnippet({ code: "hello", mode: "snippet-syntax", outputMode: "snippet-entry", prefix: "ms", title: "T" });
			expect(withDefault).toBe(explicit);
		});
	});

	describe("Body escaping", () => {
		it("passes backslashes through JSON escaping", () => {
			const result = createSnippet({ code: "C:\\path", mode: "snippet-syntax", prefix: "", title: "T" });
			expect(result).toContain('"C:\\\\path",');
		});

		it("preserves dollar signs in snippet-syntax mode", () => {
			const result = createSnippet({ code: "$1", mode: "snippet-syntax", prefix: "", title: "T" });
			expect(result).toContain('"$1",');
		});

		it("escapes dollar signs in literal mode", () => {
			const result = createSnippet({ code: "$1", mode: "literal", prefix: "", title: "T" });
			expect(result).toContain('"\\\\$1",');
		});

		it("handles multi-line code", () => {
			const result = createSnippet({ code: "line one\nline two", mode: "snippet-syntax", prefix: "", title: "T" });
			expect(result).toContain('"line one",');
			expect(result).toContain('"line two",');
		});

		it("strips trailing blank lines from the body", () => {
			const result = createSnippet({ code: "hello\n\n", mode: "snippet-syntax", prefix: "", title: "T" });
			const lines = result.split("\n");
			const bodyLines = lines.filter(line => line.startsWith("\t\t"));
			expect(bodyLines).toHaveLength(1);
		});
	});
});
