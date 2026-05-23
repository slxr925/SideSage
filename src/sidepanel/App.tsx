import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Check,
  Loader2,
  Paperclip,
  Plus,
  Send,
  Settings,
  Square,
  UserRound,
  X
} from "lucide-react";
import type { ChatMessage, ExtensionSettings, PanelRequest } from "../shared/messages";
import { DEFAULT_SETTINGS, PENDING_REQUEST_KEY } from "../shared/messages";
import { buildPromptFromRequest } from "../shared/prompts";
import { getSettings, saveSettings } from "../shared/storage";
import { useI18n } from "./I18nContext";

type SendChatOptions = {
  displayContent?: string;
  pageContent?: string;
};

const newMessage = (role: ChatMessage["role"], content: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
  createdAt: Date.now()
});

export function App() {
  const { t, locale, setLocale } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [settingsDraft, setSettingsDraft] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [attachedPage, setAttachedPage] = useState<{ title: string; url: string; text: string } | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const processedRequestIds = useRef(new Set<string>());

  const canSend = input.trim().length > 0 && !isStreaming;

  const sendChat = useCallback(
    async (content: string, options: SendChatOptions = {}) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) {
        return;
      }

      setError("");
      setInput("");
      setIsStreaming(true);

      const pageContext = options.pageContent
        ? `[${t("pageContentLabel")}]\n${options.pageContent}\n\n`
        : "";
      const fullContent = pageContext + trimmed;

      const userMessage = newMessage("user", options.displayContent?.trim() || trimmed);
      const assistantMessage = newMessage("assistant", "");
      const requestMessages = [
        ...messages.map(({ role, content }) => ({
          role,
          content
        })),
        {
          role: "user" as const,
          content: fullContent
        }
      ];

      setMessages((current) => [...current, userMessage, assistantMessage]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const baseUrl = settings.providerBaseUrl.replace(/\/$/, "");
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settings.apiKey}`
          },
          body: JSON.stringify({
            model: settings.model,
            stream: true,
            messages: [
              {
                role: "system",
                content:
                  "You are a concise, helpful assistant embedded in a browser side panel. Answer clearly and preserve important details from selected webpage text."
                  + (settings.language === "zh" ? " Always respond in Simplified Chinese (简体中文)." : "")
              },
              ...requestMessages
            ]
          }),
          signal: controller.signal
        });

        if (!response.ok || !response.body) {
          const detail = await response.text();
          throw new Error(detail || `Request failed with ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const chunks = sseBuffer.split("\n\n");
          sseBuffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const dataLine = chunk.split("\n").find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            const data = dataLine.slice(5).trim();
            if (!data || data === "[DONE]") continue;

            const event = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
              error?: { message?: string };
            };

            if (event.error?.message) {
              throw new Error(event.error.message);
            }

            const delta = event.choices?.[0]?.delta?.content;
            if (delta) {
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantMessage.id
                    ? { ...message, content: message.content + delta }
                    : message
                )
              );
            }
          }
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        const message = caught instanceof Error ? caught.message : "Unknown request error";
        setError(message);
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessage.id && !item.content
              ? { ...item, content: t("requestFailed", { message }) }
              : item
          )
        );
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [isStreaming, messages, settings.apiKey, settings.model, settings.providerBaseUrl, settings.language, t]
  );

  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    void getSettings().then((loadedSettings) => {
      setSettings(loadedSettings);
      setSettingsDraft(loadedSettings);
      setSettingsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;

    const applyRequest = (request: PanelRequest) => {
      if (processedRequestIds.current.has(request.id) || !request.selectionText.trim()) {
        return;
      }

      processedRequestIds.current.add(request.id);
      const prompt = buildPromptFromRequest(request);
      void chrome.runtime.sendMessage({ type: "ACK_PENDING_REQUEST", requestId: request.id });
      void sendChat(prompt, {
        displayContent: buildSelectionDisplay(request)
      });
    };

    chrome.runtime.sendMessage({ type: "GET_PENDING_REQUEST" }, (result) => {
      const request = result?.[PENDING_REQUEST_KEY] as PanelRequest | undefined;
      if (request) {
        applyRequest(request);
      }
    });

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== "session") {
        return;
      }

      const request = changes[PENDING_REQUEST_KEY]?.newValue as PanelRequest | undefined;
      if (request) {
        applyRequest(request);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [sendChat, settingsLoaded]);

  const openSettings = () => {
    setSettingsDraft(settings);
    setShowSettings(true);
  };

  const closeSettings = () => {
    setSettingsDraft(settings);
    setShowSettings(false);
  };

  const saveCurrentSettings = async () => {
    const normalizedSettings = {
      ...settingsDraft,
      apiKey: settingsDraft.apiKey.trim(),
      providerBaseUrl: settingsDraft.providerBaseUrl.trim() || DEFAULT_SETTINGS.providerBaseUrl,
      model: settingsDraft.model.trim() || DEFAULT_SETTINGS.model,
      language: settingsDraft.language.trim() || DEFAULT_SETTINGS.language
    };

    setSettings(normalizedSettings);
    setSettingsDraft(normalizedSettings);
    setLocale(normalizedSettings.language as "en" | "zh");
    await saveSettings(normalizedSettings);
    setShowSettings(false);
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  };

  const attachCurrentPage = async () => {
    setIsAttaching(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText
      });
      const text = (results[0]?.result as string) ?? "";
      setAttachedPage({ title: tab.title ?? "", url: tab.url ?? "", text });
    } catch {
      /* restricted pages */
    }
    setIsAttaching(false);
  };

  const doSend = () => {
    if (!canSend) return;
    const pageContent = attachedPage
      ? `${attachedPage.title} (${attachedPage.url})\n${attachedPage.text.slice(0, 15000)}`
      : undefined;
    setAttachedPage(null);
    void sendChat(input, { pageContent });
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>{t("extensionName")}</h1>
        </div>
        <div className="toolbar">
          <button
            className="icon-button"
            type="button"
            title={t("clearConversation")}
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
          >
            <Plus size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            title={t("settings")}
            onClick={showSettings ? closeSettings : openSettings}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {showSettings ? (
        <section className="settings-panel" aria-label={t("settings")}>
          <div className="settings-title">
            <h2>{t("connection")}</h2>
            <button className="icon-button compact" type="button" title={t("closeSettings")} onClick={closeSettings}>
              <X size={17} />
            </button>
          </div>
          <div className="field-stack">
            <label>
              {t("languageLabel")}
              <div className="language-toggle">
                <button
                  type="button"
                  className={`lang-option ${settingsDraft.language === "en" ? "active" : ""}`}
                  onClick={() => setSettingsDraft((c) => ({ ...c, language: "en" }))}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`lang-option ${settingsDraft.language === "zh" ? "active" : ""}`}
                  onClick={() => setSettingsDraft((c) => ({ ...c, language: "zh" }))}
                >
                  中文
                </button>
              </div>
            </label>
            <label>
              {t("apiKeyLabel")}
              <input
                type="password"
                value={settingsDraft.apiKey}
                placeholder={t("apiKeyPlaceholder")}
                onChange={(event) =>
                  setSettingsDraft((current) => ({ ...current, apiKey: event.target.value }))
                }
              />
            </label>
            <label>
              {t("providerBaseUrlLabel")}
              <input
                value={settingsDraft.providerBaseUrl}
                placeholder={t("providerBaseUrlPlaceholder")}
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    providerBaseUrl: event.target.value
                  }))
                }
              />
            </label>
            <label>
              {t("modelLabel")}
              <input
                value={settingsDraft.model}
                placeholder={t("modelPlaceholder")}
                onChange={(event) =>
                  setSettingsDraft((current) => ({ ...current, model: event.target.value }))
                }
              />
            </label>
          </div>
          <div className="settings-actions">
            <button className="secondary-button" type="button" onClick={closeSettings}>
              {t("close")}
            </button>
            <button className="save-button" type="button" onClick={() => void saveCurrentSettings()}>
              <Check size={17} />
              {t("save")}
            </button>
          </div>
        </section>
      ) : null}

      <section className="messages" aria-label={t("extensionName")}>
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          doSend();
        }}
      >
        {attachedPage ? (
          <div className="attach-row">
            <Paperclip size={14} />
            <span className="attach-label">{attachedPage.title || attachedPage.url}</span>
            <button className="icon-button compact" type="button" onClick={() => setAttachedPage(null)}>
              <X size={14} />
            </button>
          </div>
        ) : null}
        <div className="composer-row">
          <textarea
            placeholder={t("askAnything")}
            value={input}
            rows={1}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                doSend();
              }
            }}
          />
          <button
            className="icon-button"
            type="button"
            title={t("attachPage")}
            onClick={() => void attachCurrentPage()}
            disabled={isAttaching || isStreaming}
          >
            {isAttaching ? <Loader2 size={18} /> : <Paperclip size={18} />}
          </button>
          {isStreaming ? (
            <button className="send-button" type="button" title={t("stopGeneration")} onClick={stopStreaming}>
              <Square size={18} />
            </button>
          ) : (
            <button className="send-button" type="submit" title={t("send")} disabled={!canSend}>
              <Send size={18} />
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const { t } = useI18n();
  const Icon = message.role === "assistant" ? Bot : UserRound;

  return (
    <article className={`message ${message.role}`}>
      <div className="avatar">
        <Icon size={16} />
      </div>
      <div className="message-body">
        {message.content ? (
          message.role === "assistant" ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          ) : (
            message.content.split("\n").map((line, index) => (
              <p key={`${message.id}-${index}`}>{line || " "}</p>
            ))
          )
        ) : (
          <p className="thinking">
            <Loader2 size={14} />
            {t("thinking")}
          </p>
        )}
      </div>
    </article>
  );
}

function buildSelectionDisplay(request: PanelRequest): string {
  return request.selectionText;
}

function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Bot size={28} />
      </div>
      <h2>{t("noConversationYet")}</h2>
      <p>{t("emptyStateSubtext")}</p>
    </div>
  );
}
