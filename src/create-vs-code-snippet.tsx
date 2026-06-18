import { Action, ActionPanel, Clipboard, Form, Toast, getPreferenceValues, showToast } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { createSnippet } from "./snippets/create-snippet";
import { discoverSnippetFiles } from "./snippets/discover-snippet-files";
import { DuplicateSnippetError, buildSnippetEntry, insertSnippet } from "./snippets/insert-snippet";
import type { EscapeMode, OutputMode } from "./snippets/types";

interface Preferences {
	insertIntoFile: boolean;
}

interface SnippetFormValues {
	code: string;
	description: string;
	literal: boolean;
	outputMode: string;
	prefix: string;
	targetFile: string;
	title: string;
}

/**
 * Generate a VS Code snippet from a block of code, title, and prefix.
 *
 * In clipboard mode (default), the snippet is serialised and copied to the
 * clipboard ready to paste into a snippet file. In insert mode (enabled via
 * extension preferences), the snippet is written directly into the chosen VS
 * Code snippet file.
 */
export default function Command() {
	const { insertIntoFile } = getPreferenceValues<Preferences>();
	const snippetFiles = insertIntoFile ? discoverSnippetFiles() : [];

	const { handleSubmit, itemProps } = useForm<SnippetFormValues>({
		async onSubmit(formValues) {
			const mode: EscapeMode = formValues.literal ? "literal" : "snippet-syntax";

			if (insertIntoFile) {
				const { title, entry } = buildSnippetEntry({
					code: formValues.code,
					description: formValues.description,
					mode,
					prefix: formValues.prefix,
					title: formValues.title,
				});

				const filePath = formValues.targetFile;

				try {
					insertSnippet(filePath, title, entry);
				} catch (error) {
					if (error instanceof DuplicateSnippetError) {
						await showToast({
							style: Toast.Style.Failure,
							title: "Duplicate snippet",
							message: error.message,
							primaryAction: {
								title: "Overwrite",
								onAction: async () => {
									insertSnippet(filePath, title, entry, true);
									await showToast({ style: Toast.Style.Success, title: "Snippet inserted", message: filePath });
								},
							},
						});
						return;
					}

					await showToast({
						style: Toast.Style.Failure,
						title: "Failed to insert snippet",
						message: error instanceof Error ? error.message : String(error),
					});
					return;
				}

				await showToast({ style: Toast.Style.Success, title: "Snippet inserted", message: filePath });
				return;
			}

			const outputMode = formValues.outputMode as OutputMode;

			const snippet = createSnippet({
				code: formValues.code,
				description: formValues.description,
				mode,
				outputMode,
				prefix: formValues.prefix,
				title: formValues.title,
			});

			if (!snippet) {
				return;
			}

			await Clipboard.copy(snippet);

			showToast({
				style: Toast.Style.Success,
				title: "Snippet copied",
				message: "You can now paste it into the appropriate file.",
			});
		},
		validation: {
			title: value => {
				if (!value) {
					return "Please enter a snippet title";
				}
			},
			code: value => {
				if (!value) {
					return "Please enter the code to convert";
				}
			},
		},
	});

	return (
		<Form
			actions={
				<ActionPanel>
					<Action.SubmitForm title={insertIntoFile ? "Insert Snippet" : "Generate Snippet"} onSubmit={handleSubmit} />
				</ActionPanel>
			}
		>
			<Form.Description text="Enter your code snippet to convert it." />
			<Form.TextField title="Title" {...itemProps.title} />
			<Form.TextField title="Prefix" info="For multiple prefixes, please comma separate them." {...itemProps.prefix} />
			<Form.TextField title="Description" info="Optional. Shown in VS Code's IntelliSense detail panel when browsing snippets." {...itemProps.description} />
			<Form.Separator />
			<Form.TextArea title="Code" {...itemProps.code} />
			<Form.Checkbox label="Literal code (escape $ and })" title="Mode" {...itemProps.literal} />
			{!insertIntoFile && (
				<Form.Dropdown title="Output" info="Snippet entry is JSONC-compatible, ready to paste into an existing file. Snippet object is strict JSON with no trailing commas. Snippet file is a complete, standalone .code-snippets file." {...itemProps.outputMode}>
					<Form.Dropdown.Item value="snippet-entry" title="Snippet entry" />
					<Form.Dropdown.Item value="snippet-object" title="Snippet object (strict JSON)" />
					<Form.Dropdown.Item value="snippet-file" title="Snippet file" />
				</Form.Dropdown>
			)}
			{insertIntoFile && (
				<Form.Dropdown title="Target file" {...itemProps.targetFile}>
					{snippetFiles.length > 0 ? (
						snippetFiles.map(file => <Form.Dropdown.Item key={file.path} value={file.path} title={file.name} />)
					) : (
						<Form.Dropdown.Item value="" title="No snippet files found" />
					)}
				</Form.Dropdown>
			)}
		</Form>
	);
}
