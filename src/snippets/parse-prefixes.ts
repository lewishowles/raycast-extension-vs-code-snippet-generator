/**
 * Parse a raw comma-separated prefix string into a list of individual prefixes,
 * trimming whitespace and filtering out empty entries.
 *
 * @param  {string}  raw
 *     The raw prefix string from the form field.
 */
export function parsePrefixes(raw: string): string[] {
	return raw.split(",").map(prefix => prefix.trim()).filter(Boolean);
}
