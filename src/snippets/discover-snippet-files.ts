import { existsSync, readdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface SnippetFile {
	name: string;
	path: string;
}

/**
 * Scan the VS Code user snippets directory and return all `.json` and
 * `.code-snippets` files, sorted alphabetically by name.
 */
export function discoverSnippetFiles(): SnippetFile[] {
	const dir = join(homedir(), "Library/Application Support/Code/User/snippets");

	if (!existsSync(dir)) {
		return [];
	}

	return readdirSync(dir)
		.filter(name => name.endsWith(".json") || name.endsWith(".code-snippets"))
		.map(name => ({ name, path: join(dir, name) }))
		.sort((a, b) => a.name.localeCompare(b.name));
}
