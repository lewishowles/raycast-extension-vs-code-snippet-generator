// Whether to escape VS Code snippet metacharacters in the body.
export type EscapeMode = "snippet-syntax" | "literal";

// The structure of the generated output.
export type OutputMode = "snippet-entry" | "snippet-object" | "snippet-file";

// A structured VS Code snippet entry, ready for serialisation into a snippet file.
export interface SnippetEntry {
	prefix: string | string[];
	description?: string;
	body: string[];
}

// Input to the snippet generator.
export interface SnippetOptions {
	title: string;
	prefix: string;
	description?: string;
	code: string;
	mode: EscapeMode;
	outputMode?: OutputMode;
}
