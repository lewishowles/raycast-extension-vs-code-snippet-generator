import { readFileSync, writeFileSync } from "fs";
import { prepareBody } from "./escape-body";
import { parsePrefixes } from "./parse-prefixes";
import type { SnippetEntry, SnippetOptions } from "./types";

export class DuplicateSnippetError extends Error {
	constructor(title: string) {
		super(`A snippet named "${title}" already exists in this file.`);
		this.name = "DuplicateSnippetError";
	}
}

/**
 * Parse a JSONC string into a plain object, stripping line comments, block
 * comments, and trailing commas. String contents are preserved correctly —
 * comment-like sequences inside strings are not stripped.
 */
function parseJsonc(text: string): Record<string, unknown> {
	let stripped = "";
	let i = 0;

	while (i < text.length) {
		// Preserve string literals verbatim, including any comment-like content.
		if (text[i] === '"') {
			let j = i + 1;

			while (j < text.length) {
				if (text[j] === "\\") {
					j += 2;
					continue;
				}

				if (text[j] === '"') {
					j++;
					break;
				}

				j++;
			}

			stripped += text.slice(i, j);
			i = j;
			continue;
		}

		// Line comment.
		if (text[i] === "/" && text[i + 1] === "/") {
			while (i < text.length && text[i] !== "\n") i++;
			continue;
		}

		// Block comment.
		if (text[i] === "/" && text[i + 1] === "*") {
			i += 2;

			while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;

			i += 2;
			continue;
		}

		stripped += text[i++];
	}

	// Remove trailing commas before } or ].
	stripped = stripped.replace(/,(\s*[}\]])/g, "$1");

	return JSON.parse(stripped) as Record<string, unknown>;
}

/**
 * Build a structured snippet entry object from the given options, suitable for
 * direct serialisation into a VS Code snippet file.
 */
export function buildSnippetEntry(options: SnippetOptions): { title: string; entry: SnippetEntry } {
	const { code, description, mode, prefix, title } = options;
	const prefixes = parsePrefixes(prefix);
	const body = prepareBody(code, mode);

	const trimmedDescription = description?.trim() ?? "";

	const entry: SnippetEntry = {
		prefix: prefixes.length === 0 ? "" : prefixes.length === 1 ? prefixes[0] : prefixes,
		...(trimmedDescription ? { description: trimmedDescription } : {}),
		body,
	};

	return { title: title.trim(), entry };
}

/**
 * Insert a snippet entry into the given VS Code snippet file.
 *
 * Parses the existing JSONC content (stripping comments and trailing commas),
 * adds the new entry, sorts all top-level keys alphabetically, and writes
 * strict JSON back. Existing comments are not preserved.
 *
 * Throws `DuplicateSnippetError` when a key with the same title already exists
 * and `overwrite` is false.
 */
export function insertSnippet(filePath: string, title: string, entry: SnippetEntry, overwrite = false): void {
	const content = readFileSync(filePath, "utf-8");
	const parsed = parseJsonc(content);

	if (!overwrite && Object.prototype.hasOwnProperty.call(parsed, title)) {
		throw new DuplicateSnippetError(title);
	}

	parsed[title] = entry;

	const sorted = Object.fromEntries(
		Object.keys(parsed)
			.sort((a, b) => a.localeCompare(b))
			.map(key => [key, parsed[key]]),
	);

	writeFileSync(filePath, JSON.stringify(sorted, null, "\t") + "\n", "utf-8");
}
