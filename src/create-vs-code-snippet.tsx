import { Action, ActionPanel, Clipboard, Form, Toast, showToast } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { createSnippet } from "./snippets/create-snippet";
import type { EscapeMode, OutputMode } from "./snippets/types";

interface SnippetFormValues {
	code: string;
	description: string;
	literal: boolean;
	outputMode: string;
	prefix: string;
	title: string;
}

/**
 * Generate a VS Code snippet that can be pasted into a snippet file from a
 * block of code, title, and prefix.
 */
export default function Command() {
	const { handleSubmit, itemProps } = useForm<SnippetFormValues>({
		async onSubmit(formValues) {
			const mode: EscapeMode = formValues.literal ? "literal" : "snippet-syntax";
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
					<Action.SubmitForm title="Generate Snippet" onSubmit={handleSubmit} />
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
			<Form.Dropdown title="Output" info="Snippet entry is JSONC-compatible, ready to paste into an existing file. Snippet object is strict JSON with no trailing commas. Snippet file is a complete, standalone .code-snippets file." {...itemProps.outputMode}>
				<Form.Dropdown.Item value="snippet-entry" title="Snippet entry" />
				<Form.Dropdown.Item value="snippet-object" title="Snippet object (strict JSON)" />
				<Form.Dropdown.Item value="snippet-file" title="Snippet file" />
			</Form.Dropdown>
		</Form>
	);
}
