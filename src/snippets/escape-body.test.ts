import { describe, expect, it } from "vitest";
import { escapeBody } from "./escape-body";

describe("escapeBody", () => {
	describe("Line splitting", () => {
		it("splits LF line endings", () => {
			expect(escapeBody("a\nb", "snippet-syntax")).toHaveLength(2);
		});

		it("splits CRLF line endings", () => {
			expect(escapeBody("a\r\nb", "snippet-syntax")).toHaveLength(2);
		});

		it("splits CR line endings", () => {
			expect(escapeBody("a\rb", "snippet-syntax")).toHaveLength(2);
		});

		it("strips trailing empty lines", () => {
			expect(escapeBody("a\n\n", "snippet-syntax")).toHaveLength(1);
		});

		it("returns an empty array for an empty string", () => {
			expect(escapeBody("", "snippet-syntax")).toHaveLength(0);
		});
	});

	describe("JSON escaping (both modes)", () => {
		it("escapes backslashes", () => {
			// JSON.stringify turns \ into \\; the returned body content therefore
			// contains \\ so VS Code reconstructs the original single backslash.
			const [line] = escapeBody("C:\\path", "snippet-syntax");
			expect(line).toBe("C:\\\\path");
		});

		it("escapes double quotes", () => {
			const [line] = escapeBody('"hello"', "snippet-syntax");
			expect(line).toBe('\\"hello\\"');
		});

		it("escapes tab characters", () => {
			const [line] = escapeBody("\tindented", "snippet-syntax");
			expect(line).toBe("\\tindented");
		});
	});

	describe("Snippet-syntax mode", () => {
		it("preserves dollar signs", () => {
			const [line] = escapeBody("$1 placeholder", "snippet-syntax");
			expect(line).toBe("$1 placeholder");
		});

		it("preserves closing braces", () => {
			const [line] = escapeBody("${1:name}", "snippet-syntax");
			expect(line).toBe("${1:name}");
		});

		it("preserves VS Code variables", () => {
			const [line] = escapeBody("$TM_FILENAME", "snippet-syntax");
			expect(line).toBe("$TM_FILENAME");
		});
	});

	describe("Literal mode", () => {
		it("escapes dollar signs", () => {
			// $ → \$ in value; JSON.stringify then escapes \ → \\, giving \\$.
			const [line] = escapeBody("$1", "literal");
			expect(line).toBe("\\\\$1");
		});

		it("escapes closing braces", () => {
			const [line] = escapeBody("${1:name}", "literal");
			expect(line).toBe("\\\\${1:name\\\\}");
		});

		it("escapes a lone closing brace", () => {
			const [line] = escapeBody("}", "literal");
			expect(line).toBe("\\\\}");
		});

		it("still escapes backslashes via JSON", () => {
			const [line] = escapeBody("C:\\path", "literal");
			expect(line).toBe("C:\\\\path");
		});
	});
});
