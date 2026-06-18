import type { EscapeMode } from "./types";

// Pattern covering all line-ending variants (CRLF, CR, LF).
const lineEndingPattern = /\r\n|\r|\n/;

/**
 * Split `code` into lines, apply VS Code metacharacter escaping where needed,
 * and return the raw string values ready for object serialisation.
 *
 * In `literal` mode, `$` and `}` are escaped with a leading backslash so VS
 * Code treats them as plain characters. In `snippet-syntax` mode they are left
 * intact. Trailing empty lines are stripped.
 */
export function prepareBody(code: string, mode: EscapeMode): string[] {
	const lines = code.split(lineEndingPattern);

	while (lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop();
	}

	if (mode === "literal") {
		return lines.map(line => line.replace(/\$/g, "\\$").replace(/}/g, "\\}"));
	}

	return lines;
}

/**
 * Split `code` into lines, apply JSON-string escaping to each, and return the
 * escaped lines ready to embed manually in a VS Code snippet body array string.
 *
 * Builds on `prepareBody` then applies `JSON.stringify` escaping and strips the
 * surrounding quotes so callers can wrap the content themselves.
 */
export function escapeBody(code: string, mode: EscapeMode): string[] {
	return prepareBody(code, mode).map(line => JSON.stringify(line).slice(1, -1));
}
