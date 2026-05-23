import type { PanelRequest, PromptMode } from "./messages";

export const promptModeLabels: Record<PromptMode, string> = {
  ask: "Ask",
  summarize: "Summarize",
  translate: "Translate",
  explain: "Explain",
  rewrite: "Rewrite"
};

export function buildPromptFromRequest(request: PanelRequest): string {
  const source = request.pageTitle || request.pageUrl
    ? `\n\nSource: ${[request.pageTitle, request.pageUrl].filter(Boolean).join(" - ")}`
    : "";

  switch (request.mode) {
    case "translate":
      return `Translate the following text. If the text is in Chinese, translate it into English. If the text is in English, translate it into Chinese. If the text is in another language, translate it into English. Only output the translation, with no explanation or additional comments.${source}\n\nText to translate:\n${request.selectionText}`;
    case "summarize":
      return `Summarize the following text in a clear and concise way, covering the main points and key takeaways. After the summary, briefly expand on relevant background knowledge or interesting facts related to the topic to help the reader understand it better.${source}\n\nText:\n${request.selectionText}`;
    case "ask":
      return `The user selected the following text from a webpage and wants to ask a question about it. Use the selected text as context to answer the user's question accurately and helpfully.${source}\n\nSelected text:\n${request.selectionText}${request.extraPrompt ? `\n\nUser's question:\n${request.extraPrompt}` : ""}`;
    case "rewrite":
      return `Rewrite the selected text to make it clearer, more natural, and ready to paste back into the original editable field. Preserve the original meaning and language. Return only the rewritten text, with no explanation, no markdown fences, and no surrounding quotes.${source}\n\nSelected text:\n${request.selectionText}`;
    case "explain":
    default:
      return `Explain the selected text. Make the explanation clear and practical.${source}\n\nSelected text:\n${request.selectionText}`;
  }
}
