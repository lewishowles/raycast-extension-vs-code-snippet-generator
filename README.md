# VS Code snippet generator

Converts a block of code into a correctly-escaped VS Code snippet, saving the manual work of quoting backslashes, wrapping lines, and formatting JSON.

## Usage

Paste your code, fill in title, prefix, and an optional description, then either copy the result or write it directly to a snippet file.

### Example

Given this code:

```html
<div>
	<label for="input">Input</label>
	<input type="text" id="input" />
</div>
```

With title `Simple input` and prefix `input, fi`, the extension produces:

```json
"Simple input": {
	"prefix": ["input", "fi"],
	"body": [
		"<div>",
		"\t<label for=\"input\">Input</label>",
		"\t<input type=\"text\" id=\"input\" />",
		"</div>",
	],
},
```

## Output modes

When insert mode is off, a dropdown lets you choose how the result is copied to the clipboard:

| Mode           | Output                                                                          |
| -------------- | ------------------------------------------------------------------------------- |
| Snippet entry  | A single named entry (`"Title": { … }`) — paste into an existing snippet object |
| Snippet object | A full object (`{ "Title": { … } }`) — paste into a new file                    |
| Snippet file   | The raw snippet file JSON — useful for diffing or scripting                     |

## Insert mode

Enable **Insert directly into snippet file** in extension preferences to write the snippet straight to one of your VS Code snippet files instead of copying to the clipboard.

When insert mode is on:

- A file dropdown replaces the output-mode dropdown, populated by scanning `~/Library/Application Support/Code/User/snippets/`.
- If a snippet with the same title already exists in the target file, an error is shown with an **Overwrite** action.
- Snippets are written in alphabetical order by title.
- Existing JSONC comments in the file are not preserved on rewrite.

## Escape mode

By default the body is escaped for VS Code snippet syntax — `$` and `}` characters that would be interpreted as tab-stops or variables are escaped. Switch to **Literal** mode if your snippet body should be treated as plain text with no active syntax.
