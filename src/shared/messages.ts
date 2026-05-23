export type PromptMode = "ask" | "summarize" | "translate" | "explain" | "rewrite";

export type PanelRequest = {
  id: string;
  mode: PromptMode;
  selectionText: string;
  extraPrompt?: string;
  pageTitle?: string;
  pageUrl?: string;
  tabId?: number;
  isEditable?: boolean;
  createdAt: number;
};

export type ExtensionSettings = {
  apiKey: string;
  providerBaseUrl: string;
  model: string;
  language: string;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type RuntimeMessage =
  | { type: "GET_SELECTION" }
  | { type: "GET_PENDING_REQUEST" }
  | { type: "ACK_PENDING_REQUEST"; requestId: string }
  | { type: "OPEN_PANEL_WITH_CURRENT_SELECTION"; mode: PromptMode }
  | {
      type: "OPEN_PANEL_WITH_SELECTION";
      mode: PromptMode;
      selectionText: string;
      extraPrompt?: string;
      pageTitle?: string;
      pageUrl?: string;
      isEditable?: boolean;
    }
  | {
      type: "REPLACE_SELECTION";
      tabId: number;
      replacementText: string;
    }
  | {
      type: "APPLY_REPLACEMENT";
      replacementText: string;
    };

export type SelectionSnapshot = {
  selectionText: string;
  pageTitle?: string;
  pageUrl?: string;
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  apiKey: "",
  providerBaseUrl: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  language: "en"
};

export const PENDING_REQUEST_KEY = "pendingPanelRequest";
export const SETTINGS_KEY = "extensionSettings";
