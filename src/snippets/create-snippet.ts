import type { OutputMode, SnippetOptions } from "./types";
import { escapeBody } from "./escape-body";
import { parsePrefixes } from "./parse-prefixes";

/**
 * Build a VS Code snippet string. Returns an empty string if `code` is empty.
 *
 * Output format is controlled by `outputMode`:
 * - `snippet-entry` (default): JSONC-compatible entry with trailing commas,
 *   ready to paste into an existing snippet file.
 * - `snippet-object`: strict JSON entry without trailing commas.
 * - `snippet-file`: complete `{ "Title": { ... } }` JSON file.
 */
export function createSnippet(options: SnippetOptions): string {
	const { code, description, mode, outputMode = "snippet-entry", prefix, title } = options;

	if (!code.trim()) {
		return "";
	}

	const titleKey = JSON.stringify(title.trim());
	const prefixes = parsePrefixes(prefix);
	const prefixValue = serialisePrefixes(prefixes);
	const bodyLines = escapeBody(code, mode);
	const desc = description?.trim() ?? "";

	if (outputMode === "snippet-object") {
		return buildObject(titleKey, prefixValue, desc, bodyLines);
	}

	if (outputMode === "snippet-file") {
		return buildFile(titleKey, prefixValue, desc, bodyLines);
	}

	return buildEntry(titleKey, prefixValue, desc, bodyLines);
}

function buildEntry(titleKey: string, prefixValue: string, description: string, bodyLines: string[]): string {
	const body = bodyLines.map(line => `\t\t"${line}",`).join("\n");
	const descLine = description ? `\t"description": ${JSON.stringify(description)},\n` : "";

	return [
		`${titleKey}: {`,
		`\t"prefix": ${prefixValue},`,
		`${descLine}\t"body": [`,
		body,
		`\t],`,
		`},`,
	].join("\n");
}

function buildObject(titleKey: string, prefixValue: string, description: string, bodyLines: string[]): string {
	const body = bodyLines
		.map((line, i) => (i === bodyLines.length - 1 ? `\t\t"${line}"` : `\t\t"${line}",`))
		.join("\n");
	const descLine = description ? `\t"description": ${JSON.stringify(description)},\n` : "";

	return [
		`${titleKey}: {`,
		`\t"prefix": ${prefixValue},`,
		`${descLine}\t"body": [`,
		body,
		`\t]`,
		`}`,
	].join("\n");
}

function buildFile(titleKey: string, prefixValue: string, description: string, bodyLines: string[]): string {
	const body = bodyLines
		.map((line, i) => (i === bodyLines.length - 1 ? `\t\t\t"${line}"` : `\t\t\t"${line}",`))
		.join("\n");
	const descLine = description ? `\t\t"description": ${JSON.stringify(description)},\n` : "";

	return [
		`{`,
		`\t${titleKey}: {`,
		`\t\t"prefix": ${prefixValue},`,
		`${descLine}\t\t"body": [`,
		body,
		`\t\t]`,
		`\t}`,
		`}`,
	].join("\n");
}

/**
 * Serialise a list of prefixes to the correct JSON representation for a VS
 * Code snippet file: a quoted string for one prefix, a JSON array for many,
 * or an empty string when none are present.
 */
function serialisePrefixes(prefixes: string[]): string {
	if (prefixes.length === 0) {
		return "\"\"";
	}

	if (prefixes.length === 1) {
		return JSON.stringify(prefixes[0]);
	}

	return JSON.stringify(prefixes);
}

export type { OutputMode };
