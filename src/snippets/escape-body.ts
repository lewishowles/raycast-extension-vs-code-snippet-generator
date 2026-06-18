import type { EscapeMode } from "./types";

// Pattern covering all line-ending variants (CRLF, CR, LF).
const lineEndingPattern = /\r\n|\r|\n/;

/**
 * Split `code` into lines, apply JSON-string escaping to each, and return the
 * escaped lines ready to embed in a VS Code snippet body array.
 *
 * In `snippet-syntax` mode, `$` and `}` are left intact so VS Code placeholder
 * syntax survives. In `literal` mode, they are escaped so the output is plain
 * text.
 *
 * Trailing empty lines are stripped to avoid a blank line at the end of every
 * inserted snippet.
 *
 * @param  {string}      code
 *     Raw source code from the form field.
 * @param  {EscapeMode}  mode
 *     Whether to preserve or escape VS Code snippet metacharacters.
 */
export function escapeBody(code: string, mode: EscapeMode): string[] {
	const lines = code.split(lineEndingPattern);

	while (lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop();
	}

	return lines.map(line => {
		if (mode === "literal") {
			// Escape before JSON.stringify so the resulting backslash is itself
			// JSON-escaped, giving VS Code the \$ or \} it needs to treat these
			// as plain characters.
			line = line.replace(/\$/g, "\\$").replace(/}/g, "\\}");
		}

		// JSON.stringify handles \, ", and all control characters (tab, CR, LF).
		// Slice removes the surrounding quotes — callers wrap the content themselves.
		return JSON.stringify(line).slice(1, -1);
	});
}
