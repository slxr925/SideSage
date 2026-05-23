import type { ExtensionSettings, PromptMode, RuntimeMessage } from "../shared/messages";
import type { LocaleKey } from "../shared/i18n/types";

const LOCALE_STORAGE_KEY = "extensionLanguage";
const catalogs: Record<string, Record<string, string>> = {
  en: {
    extensionName: "SideSage",
    readyForSelectedText: "Ready for selected text",
    messagesCount: "{n} messages",
    clearConversation: "Clear conversation",
    settings: "Settings",
    connection: "Connection",
    closeSettings: "Close settings",
    apiKeyLabel: "API key",
    apiKeyPlaceholder: "sk-...",
    providerBaseUrlLabel: "Provider base URL",
    providerBaseUrlPlaceholder: "https://api.openai.com/v1",
    modelLabel: "Model",
    modelPlaceholder: "gpt-4.1-mini",
    proxyBaseUrlLabel: "Proxy base URL",
    proxyBaseUrlPlaceholder: "http://127.0.0.1:8787",
    close: "Close",
    save: "Save",
    noConversationYet: "No conversation yet",
    emptyStateSubtext: "Ask, Summarize, Translate, or Explain",
    askAnything: "Ask anything...",
    stopGeneration: "Stop generation",
    send: "Send",
    thinking: "Thinking",
    ask: "Ask",
    summarize: "Summarize",
    translate: "Translate",
    explain: "Explain",
    rewrite: "Rewrite",
    askBrowerHelper: "Ask SideSage",
    summarizeBrowerHelper: "Summarize with SideSage",
    translateBrowerHelper: "Translate with SideSage",
    explainBrowerHelper: "Explain with SideSage",
    rewriteBrowerHelper: "Rewrite with SideSage",
    openSidePanelNotice: "Open the extension side panel to see the response.",
    extensionReloadedNotice: "Extension was reloaded. Refresh this page and try again.",
    rewriting: "Rewriting...",
    reviewBeforeApplying: "Review before applying",
    reviewRefineHint: "Review, or rewrite again to refine",
    canceled: "Canceled",
    rewriteFailed: "Rewrite failed",
    rewriteDialogTitle: "Rewrite",
    closeDialog: "Close",
    chooseDirection: "Choose a direction, or rewrite directly.",
    rewritePresetsLabel: "Rewrite presets",
    clearer: "Clearer",
    clearerDirection: "Make it clearer and easier to read.",
    shorter: "Shorter",
    shorterDirection: "Make it shorter while preserving meaning.",
    professional: "Professional",
    professionalDirection: "Make it more professional and polished.",
    friendlier: "Friendlier",
    friendlierDirection: "Make it warmer and friendlier.",
    directionLabel: "Direction",
    directionPlaceholder: "Optional: make it shorter, more formal, more direct...",
    resultLabel: "Result",
    cancel: "Cancel",
    rewriteButton: "Rewrite",
    rewriteAgain: "Rewrite Again",
    apply: "Apply",
    languageLabel: "Language",
    requestFailed: "Request failed: {message}"
  },
  zh: {
    extensionName: "SideSage",
    readyForSelectedText: "等待选中文本",
    messagesCount: "{n} 条消息",
    clearConversation: "清空对话",
    settings: "设置",
    connection: "连接",
    closeSettings: "关闭设置",
    apiKeyLabel: "API 密钥",
    apiKeyPlaceholder: "sk-...",
    providerBaseUrlLabel: "服务商地址",
    providerBaseUrlPlaceholder: "https://api.openai.com/v1",
    modelLabel: "模型",
    modelPlaceholder: "gpt-4.1-mini",
    proxyBaseUrlLabel: "代理地址",
    proxyBaseUrlPlaceholder: "http://127.0.0.1:8787",
    close: "关闭",
    save: "保存",
    noConversationYet: "暂无对话",
    emptyStateSubtext: "提问、总结、翻译或解释",
    askAnything: "输入你的问题...",
    stopGeneration: "停止生成",
    send: "发送",
    thinking: "思考中",
    ask: "提问",
    summarize: "总结",
    translate: "翻译",
    explain: "解释",
    rewrite: "改写",
    askBrowerHelper: "向 SideSage 提问",
    summarizeBrowerHelper: "使用 SideSage 总结",
    translateBrowerHelper: "使用 SideSage 翻译",
    explainBrowerHelper: "使用 SideSage 解释",
    rewriteBrowerHelper: "使用 SideSage 改写",
    openSidePanelNotice: "请打开扩展侧边栏查看回复。",
    extensionReloadedNotice: "扩展已重新加载，请刷新页面后重试。",
    rewriting: "改写中...",
    reviewBeforeApplying: "确认后应用",
    reviewRefineHint: "检查结果，或继续改写以优化",
    canceled: "已取消",
    rewriteFailed: "改写失败",
    rewriteDialogTitle: "改写",
    closeDialog: "关闭",
    chooseDirection: "选择改写方向，或直接改写。",
    rewritePresetsLabel: "改写预设",
    clearer: "更清晰",
    clearerDirection: "使文本更加清晰易读。",
    shorter: "更简短",
    shorterDirection: "在保留含义的前提下缩短文本。",
    professional: "更专业",
    professionalDirection: "使文本更加专业、得体。",
    friendlier: "更亲切",
    friendlierDirection: "使文本更加温暖友好。",
    directionLabel: "改写方向",
    directionPlaceholder: "可选：更简短、更正式、更直接...",
    resultLabel: "结果",
    cancel: "取消",
    rewriteButton: "改写",
    rewriteAgain: "再次改写",
    apply: "应用",
    languageLabel: "语言",
    requestFailed: "请求失败：{message}"
  }
};
let currentLocale = "en";

function t(key: LocaleKey, params?: Record<string, string | number>): string {
  let value = catalogs[currentLocale]?.[key] ?? catalogs.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

async function loadLocaleFromStorage(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(LOCALE_STORAGE_KEY);
    const stored = result[LOCALE_STORAGE_KEY] as string | undefined;
    if (stored === "en" || stored === "zh") {
      currentLocale = stored;
    }
  } catch {
    // Extension context may be unavailable
  }
}

const SETTINGS_KEY = "extensionSettings";
const DEFAULT_SETTINGS: ExtensionSettings = {
  apiKey: "",
  providerBaseUrl: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  language: "en"
};

type EditableSelection =
  | {
      kind: "text-control";
      element: HTMLInputElement | HTMLTextAreaElement;
      start: number;
      end: number;
    }
  | {
      kind: "contenteditable";
      root: HTMLElement;
      range: Range;
    };

let latestSelection = "";
let latestEditableSelection: EditableSelection | undefined;
let floatingHost: HTMLDivElement | undefined;
let rewriteHost: HTMLDivElement | undefined;
let askHost: HTMLDivElement | undefined;
let hideTimer: number | undefined;
let showTimer: number | undefined;
let rewriteAbortController: AbortController | undefined;
let rewriteOriginalText = "";
let rewriteOriginalEditable: EditableSelection | undefined;
let rewriteIterationCount = 0;

const SPARKLE_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>`;

const REWRITE_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;

const DARK_PANEL_CSS = `
@media (prefers-color-scheme: dark) {
  .panel { background: rgba(22, 24, 32, 0.95); color: #e5e7eb; }
  header { border-bottom-color: rgba(255,255,255,0.06); }
  h2 { color: #e5e7eb; }
  .close { color: #6b7280; }
  .close:hover { background: #252830; color: #d1d5db; }
  .status { color: #9ca3af; }
  .label { color: #9ca3af; }
  .selected-preview { border-color: #2a2d35; background: #1e2028; color: #9ca3af; }
  textarea { border-color: #2a2d35; color: #e5e7eb; background: #1e2028; }
  textarea:focus { border-color: #F97316; box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15); }
  .ask-output,.result { background: #1e2028; border-color: #2a2d35; color: #e5e7eb; }
  .ask-output h1,.ask-output h2,.ask-output h3,.ask-output h4,.result h1,.result h2,.result h3,.result h4 { color: #f3f4f6; }
  .ask-output code,.result code { background: #252830; }
  .ask-output pre,.result pre { border-color: #2a2d35; background: #1e2028; }
  .cancel { border-color: #2a2d35; color: #9ca3af; background: #1e2028; }
  .cancel:hover { background: #252830; color: #d1d5db; }
  .preset { border-color: #2a2d35; color: #9ca3af; background: #1e2028; }
  .preset:hover { border-color: #F97316; color: #F97316; background: #1c1510; }
  .close-btn { border-color: #2a2d35; color: #9ca3af; background: #1e2028; }
  .close-btn:hover { background: #252830; color: #d1d5db; }
}
`;

void loadLocaleFromStorage();

const updateSelection = () => {
  const textControlSelection = getTextControlSelection();
  if (textControlSelection) {
    latestEditableSelection = textControlSelection;
    latestSelection = textControlSelection.element.value
      .slice(textControlSelection.start, textControlSelection.end)
      .trim();
    return;
  }

  const selection = window.getSelection();
  latestSelection = selection?.toString().trim() ?? "";
  latestEditableSelection = getContentEditableSelection(selection);
};

const getTextControlSelection = (): Extract<EditableSelection, { kind: "text-control" }> | undefined => {
  const activeElement = document.activeElement;
  if (!isSelectableTextControl(activeElement)) {
    return undefined;
  }

  const start = activeElement.selectionStart;
  const end = activeElement.selectionEnd;
  if (typeof start !== "number" || typeof end !== "number" || start === end) {
    return undefined;
  }

  return {
    kind: "text-control",
    element: activeElement,
    start,
    end
  };
};

const getContentEditableSelection = (
  selection: Selection | null
): Extract<EditableSelection, { kind: "contenteditable" }> | undefined => {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !selection.toString().trim()) {
    return undefined;
  }

  const root = getEditableRoot(selection.anchorNode);
  if (!root) {
    return undefined;
  }

  return {
    kind: "contenteditable",
    root,
    range: selection.getRangeAt(0).cloneRange()
  };
};

const getSelectionRect = (): DOMRect | undefined => {
  if (latestEditableSelection?.kind === "text-control") {
    return latestEditableSelection.element.getBoundingClientRect();
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return undefined;
  }

  const range = selection.getRangeAt(0);
  const rects = Array.from(range.getClientRects()).filter(
    (rect) => rect.width > 0 && rect.height > 0
  );

  return rects[0] || range.getBoundingClientRect();
};

const ensureFloatingButton = () => {
  if (floatingHost) {
    return floatingHost;
  }

  floatingHost = document.createElement("div");
  floatingHost.id = "browerhelper-selection-entry";
  floatingHost.style.position = "fixed";
  floatingHost.style.zIndex = "2147483647";
  floatingHost.style.pointerEvents = "auto";
  floatingHost.style.display = "none";

  const shadow = floatingHost.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        z-index: 2147483647;
        pointer-events: auto;
      }

      .entry {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        overflow: hidden;
        border: none;
        border-radius: 20px;
        padding: 4px;
        color: #ffffff;
        background: linear-gradient(135deg, #EA580C 0%, #F97316 100%);
        box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35), 0 1px 3px rgba(0, 0, 0, 0.1);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        transform: translateY(2px) scale(0.92);
        opacity: 0;
        animation: pop 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        transition: gap 150ms ease, padding 150ms ease, background 200ms ease, box-shadow 200ms ease;
      }

      .mark,
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        border: 0;
        border-radius: 16px;
      }

      .mark {
        width: 28px;
        color: #ffffff;
        background: rgba(255, 255, 255, 0.2);
      }

      button {
        width: 0;
        padding: 0;
        opacity: 0;
        color: #ffffff;
        background: transparent;
        cursor: pointer;
        white-space: nowrap;
        gap: 4px;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        transition:
          width 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
          padding 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
          opacity 120ms ease,
          background 140ms ease;
      }

      .entry:hover {
        gap: 2px;
        padding: 4px 4px;
        background: linear-gradient(135deg, #C2410C 0%, #EA580C 100%);
        box-shadow: 0 6px 20px rgba(234, 88, 12, 0.45), 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .entry:hover button {
        width: auto;
        padding: 0 10px;
        opacity: 1;
      }

      button:hover {
        background: rgba(255, 255, 255, 0.18);
        border-radius: 12px;
      }

      .rewrite {
        display: none;
      }

      :host([data-editable="true"]) .rewrite {
        display: inline-flex;
      }

      @keyframes pop {
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    
        ${DARK_PANEL_CSS}
    </style>
    <div class="entry" title="${t("extensionName")}">
      <span class="mark">${SPARKLE_ICON_SVG}</span>
      <button class="ask" type="button">${t("ask")}</button>
      <button class="summarize" type="button">${t("summarize")}</button>
      <button class="translate" type="button">${t("translate")}</button>
      <button class="rewrite" type="button">${t("rewrite")}</button>
    </div>
  `;

  const askButton = shadow.querySelector<HTMLButtonElement>(".ask");
  const summarizeButton = shadow.querySelector<HTMLButtonElement>(".summarize");
  const translateButton = shadow.querySelector<HTMLButtonElement>(".translate");
  const rewriteButton = shadow.querySelector<HTMLButtonElement>(".rewrite");
  for (const button of [askButton, summarizeButton, translateButton, rewriteButton]) {
    button?.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  askButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void askInPage();
  });
  summarizeButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void autoInPage("summarize");
  });
  translateButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void autoInPage("translate");
  });
  rewriteButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void rewriteInPage();
  });

  shadow.querySelector(".entry")?.addEventListener("mouseenter", () => {
    if (hideTimer) {
      window.clearTimeout(hideTimer);
    }
  });

  document.documentElement.append(floatingHost);
  return floatingHost;
};

const showFloatingButton = () => {
  updateSelection();
  const rect = getSelectionRect();
  if (!latestSelection || !rect) {
    hideFloatingButton();
    return;
  }

  const host = ensureFloatingButton();
  const top = Math.max(8, rect.top - 44);
  const left = Math.max(8, Math.min(window.innerWidth - 140, rect.left));

  host.dataset.editable = latestEditableSelection ? "true" : "false";
  host.style.top = `${top}px`;
  host.style.left = `${left}px`;
  host.style.display = "block";
};

const scheduleShowFloatingButton = () => {
  if (showTimer) {
    window.clearTimeout(showTimer);
  }
  if (hideTimer) {
    window.clearTimeout(hideTimer);
  }

  showTimer = window.setTimeout(showFloatingButton, 80);
};

const hideFloatingButton = () => {
  if (floatingHost) {
    floatingHost.style.display = "none";
  }
};

const scheduleHideFloatingButton = () => {
  if (hideTimer) {
    window.clearTimeout(hideTimer);
  }

  hideTimer = window.setTimeout(() => {
    updateSelection();
    if (!latestSelection) {
      hideFloatingButton();
    }
  }, 120);
};

const ASK_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

let askAbortController: AbortController | undefined;

const askInPage = async () => {
  updateSelection();
  const rect = getSelectionRect();
  if (!latestSelection || !rect) {
    hideFloatingButton();
    return;
  }
  hideFloatingButton();
  showAskPanel(rect, latestSelection);
};

const showAskPanel = (rect: DOMRect, selectedText: string) => {
  if (askHost) {
    askHost.remove();
  }

  askHost = document.createElement("div");
  askHost.id = "browerhelper-ask-panel";
  askHost.style.position = "fixed";
  askHost.style.zIndex = "2147483647";
  askHost.style.pointerEvents = "auto";

  const top = Math.max(12, Math.min(window.innerHeight - 340, rect.bottom + 10));
  const left = Math.max(12, Math.min(window.innerWidth - 400, rect.left));
  askHost.style.top = `${top}px`;
  askHost.style.left = `${left}px`;

  const preview = selectedText.length > 150 ? selectedText.slice(0, 150) + "..." : selectedText;

  const shadow = askHost.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; position: fixed; z-index: 2147483647; pointer-events: auto; }
      * { box-sizing: border-box; }
      .panel {
        width: min(400px, calc(100vw - 24px));
        border: 1px solid rgba(0, 0, 0, 0.06);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18), 0 1px 3px rgba(0, 0, 0, 0.06);
        color: #111827;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        overflow: hidden;
        animation: panel-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); }
      header .icon { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 8px; background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); color: #ffffff; }
      h2 { margin: 0; flex: 1; font-size: 14px; font-weight: 700; color: #111827; }
      .close { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 8px; background: transparent; color: #9ca3af; cursor: pointer; font-size: 18px; transition: background 120ms ease, color 120ms ease; }
      .close:hover { background: #f3f4f6; color: #374151; }
      .body { display: grid; gap: 8px; padding: 12px 14px 14px; }
      .status { min-height: 16px; color: #6b7280; font-size: 12px; }
      .selected-preview { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; background: #f8fafc; color: #6b7280; font-size: 12px; line-height: 1.45; max-height: 60px; overflow-y: auto; }
      textarea {
        width: 100%; box-sizing: border-box; border: 1px solid #e5e7eb; border-radius: 10px; padding: 9px 11px;
        color: #111827; background: #ffffff; font: inherit; font-size: 13px; line-height: 1.45;
        outline: none; resize: vertical; transition: border-color 150ms ease, box-shadow 150ms ease;
      }
      textarea:focus { border-color: #F97316; box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1); }
      .ask-input { min-height: 48px; max-height: 100px; }
      .ask-output { min-height: 80px; max-height: 200px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 9px 11px; font-size: 13px; line-height: 1.55; overflow-y: auto; color: #1f2937; }
      .ask-output h1,.ask-output h2,.ask-output h3,.ask-output h4 { margin: 8px 0 4px; font-size: 14px; font-weight: 700; color: #111827; }
      .ask-output p { margin: 4px 0; }
      .ask-output ul,.ask-output ol { margin: 4px 0; padding-left: 18px; }
      .ask-output li { margin: 2px 0; }
      .ask-output code { border-radius: 4px; padding: 1px 5px; background: #f1f5f9; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      .ask-output pre { margin: 8px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; background: #f1f5f9; overflow-x: auto; }
      .ask-output pre code { padding: 0; background: transparent; }
      .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .actions button { display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 36px; border-radius: 10px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 140ms ease; }
      .cancel { border: 1px solid #e5e7eb; color: #6b7280; background: #ffffff; }
      .cancel:hover { background: #f9fafb; color: #374151; }
      .send { border: none; color: #ffffff; background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25); }
      .send:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(234, 88, 12, 0.35); transform: translateY(-1px); }
      .send:disabled { background: #e5e7eb; color: #9ca3af; box-shadow: none; cursor: not-allowed; transform: none; }
      @keyframes panel-in { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    
        ${DARK_PANEL_CSS}
    </style>
    <section class="panel" role="dialog" aria-label="${t("ask")}">
      <header>
        <div class="icon">${ASK_ICON_SVG}</div>
        <h2>${t("ask")}</h2>
        <button class="close" type="button" title="${t("closeDialog")}">×</button>
      </header>
      <div class="body">
        <div class="selected-preview">${preview.replace(/</g, "&lt;")}</div>
        <textarea class="ask-input" aria-label="${t("askAnything")}" placeholder="${t("askAnything")}"></textarea>
        <div class="status"></div>
        <div class="ask-output" style="display:none"></div>
        <div class="actions">
          <button class="cancel" type="button">${t("cancel")}</button>
          <button class="send" type="button" disabled>${t("send")}</button>
        </div>
      </div>
    </section>
  `;

  const close = () => {
    askAbortController?.abort();
    askAbortController = undefined;
    askHost?.remove();
    askHost = undefined;
  };

  shadow.querySelector(".close")?.addEventListener("click", close);
  shadow.querySelector(".cancel")?.addEventListener("click", close);

  const input = shadow.querySelector<HTMLTextAreaElement>(".ask-input");
  const sendBtn = shadow.querySelector<HTMLButtonElement>(".send");
  const output = shadow.querySelector<HTMLDivElement>(".ask-output");
  const status = shadow.querySelector<HTMLElement>(".status");

  input?.addEventListener("input", () => {
    if (sendBtn) {
      sendBtn.disabled = !(input.value.trim());
    }
  });

  const submit = () => {
    const question = input?.value.trim();
    if (!question || !input || !sendBtn) return;
    sendBtn.disabled = true;
    if (status) status.textContent = t("thinking");
    void runAskFromPanel(selectedText, question);
  };

  sendBtn?.addEventListener("click", submit);
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  });

  document.documentElement.append(askHost);
  input?.focus();
};

const runAskFromPanel = async (selectedText: string, question: string) => {
  const output = askHost?.shadowRoot?.querySelector<HTMLDivElement>(".ask-output");
  const status = askHost?.shadowRoot?.querySelector<HTMLElement>(".status");
  const sendBtn = askHost?.shadowRoot?.querySelector<HTMLButtonElement>(".send");
  if (!output || !status || !sendBtn) return;

  output.style.display = "block";
  let rawText = "";

  askAbortController?.abort();
  askAbortController = new AbortController();

  try {
    const settings = await getSettings();
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
              + (currentLocale === "zh" ? " Always respond in Simplified Chinese (简体中文)." : "")
          },
          {
            role: "user",
            content: `The user selected the following text from a webpage and wants to ask a question about it. Use the selected text as context to answer the user's question accurately and helpfully.\n\nSelected text:\n${selectedText}\n\nUser's question:\n${question}`
          }
        ]
      }),
      signal: askAbortController.signal
    });

    if (!response.ok || !response.body) {
      const detail = await response.text();
      throw new Error(detail || `Request failed with ${response.status}`);
    }

    for await (const event of readSseStream(response.body)) {
      if (event.type === "delta") {
        rawText += event.delta;
        output.innerHTML = renderMarkdownToHtml(rawText);
      }
      if (event.type === "error") {
        throw new Error(event.message);
      }
    }

    status.textContent = "";
  } catch (error) {
    if (askAbortController.signal.aborted) {
      status.textContent = t("canceled");
      return;
    }
    status.textContent = error instanceof Error ? error.message : t("rewriteFailed");
  } finally {
    askAbortController = undefined;
    sendBtn.disabled = false;
  }
};

const TRANSLATE_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>`;

const SUMMARIZE_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`;

let autoHost: HTMLDivElement | undefined;
let autoAbortController: AbortController | undefined;

const autoInPage = async (mode: "translate" | "summarize") => {
  updateSelection();
  const rect = getSelectionRect();
  if (!latestSelection || !rect) {
    hideFloatingButton();
    return;
  }
  hideFloatingButton();
  showAutoPanel(rect, latestSelection, mode);
};

function buildAutoPrompt(mode: "translate" | "summarize", text: string): string {
  if (mode === "translate") {
    return `Translate the following text. If the text is in Chinese, translate it into English. If the text is in English, translate it into Chinese. If the text is in another language, translate it into English. Only output the translation, with no explanation or additional comments.\n\nText to translate:\n${text}`;
  }
  return `Summarize the following text in a clear and concise way, covering the main points and key takeaways. After the summary, briefly expand on relevant background knowledge or interesting facts related to the topic to help the reader understand it better.\n\nText:\n${text}`;
}

const showAutoPanel = (rect: DOMRect, selectedText: string, mode: "translate" | "summarize") => {
  if (autoHost) {
    autoHost.remove();
  }

  const title = mode === "translate" ? t("translate") : t("summarize");
  const icon = mode === "translate" ? TRANSLATE_ICON_SVG : SUMMARIZE_ICON_SVG;

  autoHost = document.createElement("div");
  autoHost.id = `browerhelper-${mode}-panel`;
  autoHost.style.position = "fixed";
  autoHost.style.zIndex = "2147483647";
  autoHost.style.pointerEvents = "auto";

  const top = Math.max(12, Math.min(window.innerHeight - 300, rect.bottom + 10));
  const left = Math.max(12, Math.min(window.innerWidth - 400, rect.left));
  autoHost.style.top = `${top}px`;
  autoHost.style.left = `${left}px`;

  const preview = selectedText.length > 150 ? selectedText.slice(0, 150) + "..." : selectedText;

  const shadow = autoHost.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; position: fixed; z-index: 2147483647; pointer-events: auto; }
      * { box-sizing: border-box; }
      .panel {
        width: min(400px, calc(100vw - 24px));
        border: 1px solid rgba(0, 0, 0, 0.06);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18), 0 1px 3px rgba(0, 0, 0, 0.06);
        color: #111827;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        overflow: hidden;
        animation: panel-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); }
      header .icon { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 8px; background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); color: #ffffff; }
      h2 { margin: 0; flex: 1; font-size: 14px; font-weight: 700; color: #111827; }
      .close { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 8px; background: transparent; color: #9ca3af; cursor: pointer; font-size: 18px; transition: background 120ms ease, color 120ms ease; }
      .close:hover { background: #f3f4f6; color: #374151; }
      .body { display: grid; gap: 8px; padding: 12px 14px 14px; }
      .selected-preview { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; background: #f8fafc; color: #6b7280; font-size: 12px; line-height: 1.45; max-height: 60px; overflow-y: auto; }
      .status { min-height: 16px; color: #6b7280; font-size: 12px; }
      .result { min-height: 80px; max-height: 200px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 9px 11px; font-size: 13px; line-height: 1.55; overflow-y: auto; color: #1f2937; }
      .result h1,.result h2,.result h3,.result h4 { margin: 8px 0 4px; font-size: 14px; font-weight: 700; color: #111827; }
      .result p { margin: 4px 0; }
      .result ul,.result ol { margin: 4px 0; padding-left: 18px; }
      .result li { margin: 2px 0; }
      .result code { border-radius: 4px; padding: 1px 5px; background: #f1f5f9; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      .result pre { margin: 8px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; background: #f1f5f9; overflow-x: auto; }
      .result pre code { padding: 0; background: transparent; }
      .actions { display: grid; grid-template-columns: 1fr; gap: 8px; }
      .actions button { display: inline-flex; align-items: center; justify-content: center; height: 36px; border-radius: 10px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 140ms ease; }
      .close-btn { border: 1px solid #e5e7eb; color: #6b7280; background: #ffffff; width: 100%; }
      .close-btn:hover { background: #f9fafb; color: #374151; }
      @keyframes panel-in { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    
        ${DARK_PANEL_CSS}
    </style>
    <section class="panel" role="dialog" aria-label="${title}">
      <header>
        <div class="icon">${icon}</div>
        <h2>${title}</h2>
        <button class="close" type="button" title="${t("closeDialog")}">×</button>
      </header>
      <div class="body">
        <div class="selected-preview">${preview.replace(/</g, "&lt;")}</div>
        <div class="status">${t("thinking")}</div>
        <div class="result" style="display:none"></div>
        <div class="actions">
          <button class="close-btn" type="button">${t("close")}</button>
        </div>
      </div>
    </section>
  `;

  const close = () => {
    autoAbortController?.abort();
    autoAbortController = undefined;
    autoHost?.remove();
    autoHost = undefined;
  };

  shadow.querySelector(".close")?.addEventListener("click", close);
  shadow.querySelector(".close-btn")?.addEventListener("click", close);

  document.documentElement.append(autoHost);
  void runAutoFromPanel(selectedText, mode);
};
const runAutoFromPanel = async (selectedText: string, mode: "translate" | "summarize") => {
  const output = autoHost?.shadowRoot?.querySelector<HTMLDivElement>(".result");
  const status = autoHost?.shadowRoot?.querySelector<HTMLElement>(".status");
  if (!output || !status) return;

  output.style.display = "block";
  let rawText = "";

  autoAbortController?.abort();
  autoAbortController = new AbortController();

  try {
    const settings = await getSettings();
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
              + (currentLocale === "zh" ? " Always respond in Simplified Chinese (简体中文)." : "")
          },
          { role: "user", content: buildAutoPrompt(mode, selectedText) }
        ]
      }),
      signal: autoAbortController.signal
    });

    if (!response.ok || !response.body) {
      const detail = await response.text();
      throw new Error(detail || `Request failed with ${response.status}`);
    }

    for await (const event of readSseStream(response.body)) {
      if (event.type === "delta") {
        rawText += event.delta;
        output.innerHTML = renderMarkdownToHtml(rawText);
      }
      if (event.type === "error") {
        throw new Error(event.message);
      }
    }

    status.textContent = "";
  } catch (error) {
    if (autoAbortController.signal.aborted) {
      status.textContent = t("canceled");
      return;
    }
    status.textContent = error instanceof Error ? error.message : t("rewriteFailed");
  } finally {
    autoAbortController = undefined;
  }
};

const sendSelection = async (mode: PromptMode, extraPrompt?: string) => {
  updateSelection();
  if (!latestSelection) {
    hideFloatingButton();
    return;
  }

  const isEditableRewrite = mode === "rewrite" && Boolean(latestEditableSelection);
  hideFloatingButton();
  try {
    const response = await chrome.runtime.sendMessage({
      type: "OPEN_PANEL_WITH_SELECTION",
      mode,
      selectionText: latestSelection,
      extraPrompt,
      pageTitle: document.title,
      pageUrl: window.location.href,
      isEditable: isEditableRewrite
    } satisfies RuntimeMessage);

    if (!response?.panelOpened) {
      showTransientNotice(t("openSidePanelNotice"));
    }
  } catch {
    showTransientNotice(t("extensionReloadedNotice"));
  }
};




const rewriteInPage = async () => {
  updateSelection();
  const rect = getSelectionRect();
  if (!latestSelection || !latestEditableSelection || !rect) {
    hideFloatingButton();
    return;
  }

  hideFloatingButton();
  rewriteIterationCount = 0;
  showRewritePanel(rect, latestSelection);
};

const runRewriteFromPanel = async (panel: HTMLDivElement) => {
  const output = panel.shadowRoot?.querySelector<HTMLTextAreaElement>(".rewrite-output");
  const direction = panel.shadowRoot?.querySelector<HTMLTextAreaElement>(".rewrite-direction");
  const status = panel.shadowRoot?.querySelector<HTMLElement>(".status");
  const rewriteButton = panel.shadowRoot?.querySelector<HTMLButtonElement>(".rewrite-run");
  const applyButton = panel.shadowRoot?.querySelector<HTMLButtonElement>(".apply");

  if (!output || !direction || !status || !rewriteButton || !applyButton) {
    return;
  }

  const previousDraft = output.value.trim();
  output.value = "";
  status.textContent = t("rewriting");
  rewriteButton.disabled = true;
  applyButton.disabled = true;

  rewriteAbortController?.abort();
  rewriteAbortController = new AbortController();

  try {
    const settings = await getSettings();
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
              + (currentLocale === "zh" ? " Always respond in Simplified Chinese (简体中文)." : "")
          },
          {
            role: "user",
            content: buildRewritePrompt(rewriteOriginalText, {
              direction: direction.value.trim(),
              previousDraft
            })
          }
        ]
      }),
      signal: rewriteAbortController.signal
    });

    if (!response.ok || !response.body) {
      const detail = await response.text();
      throw new Error(detail || `Request failed with ${response.status}`);
    }

    for await (const event of readSseStream(response.body)) {
      if (event.type === "delta") {
        output.value += event.delta;
      }

      if (event.type === "error") {
        throw new Error(event.message);
      }
    }

    output.value = normalizeReplacementText(output.value);
    rewriteIterationCount++;
    status.textContent = rewriteIterationCount <= 1
      ? t("reviewBeforeApplying")
      : t("reviewRefineHint");
    applyButton.disabled = !output.value.trim();
  } catch (error) {
    if (rewriteAbortController.signal.aborted) {
      status.textContent = t("canceled");
      return;
    }

    status.textContent = error instanceof Error ? error.message : t("rewriteFailed");
  } finally {
    rewriteAbortController = undefined;
    rewriteButton.disabled = false;
    rewriteButton.innerHTML = `${REWRITE_ICON_SVG} ${
      rewriteIterationCount > 0
        ? t("rewriteAgain")
        : t("rewriteButton")
    }`;
  }
};

const showRewritePanel = (rect: DOMRect, originalText: string) => {
  if (rewriteHost) {
    rewriteHost.remove();
  }

  rewriteOriginalText = originalText;
  rewriteOriginalEditable = latestEditableSelection;

  rewriteHost = document.createElement("div");
  rewriteHost.id = "browerhelper-rewrite-panel";
  rewriteHost.style.position = "fixed";
  rewriteHost.style.zIndex = "2147483647";
  rewriteHost.style.pointerEvents = "auto";

  const top = Math.max(12, Math.min(window.innerHeight - 340, rect.bottom + 10));
  const left = Math.max(12, Math.min(window.innerWidth - 400, rect.left));
  rewriteHost.style.top = `${top}px`;
  rewriteHost.style.left = `${left}px`;

  const shadow = rewriteHost.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        z-index: 2147483647;
        pointer-events: auto;
      }

      * {
        box-sizing: border-box;
      }

      .panel {
        width: min(400px, calc(100vw - 24px));
        border: 1px solid rgba(0, 0, 0, 0.06);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18), 0 1px 3px rgba(0, 0, 0, 0.06);
        color: #111827;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        overflow: hidden;
        animation: panel-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }

      header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }

      header .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 8px;
        background: linear-gradient(135deg, #EA580C 0%, #F97316 100%);
        color: #ffffff;
      }

      h2 {
        margin: 0;
        flex: 1;
        font-size: 14px;
        font-weight: 700;
        color: #111827;
      }

      .close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: #9ca3af;
        cursor: pointer;
        font-size: 18px;
        transition: background 120ms ease, color 120ms ease;
      }

      .close:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .body {
        display: grid;
        gap: 8px;
        padding: 12px 14px 14px;
      }

      .status {
        min-height: 16px;
        color: #6b7280;
        font-size: 12px;
      }

      .label {
        color: #374151;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .preset-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .preset {
        height: 28px;
        border: 1px solid #e5e7eb;
        border-radius: 999px;
        padding: 0 12px;
        color: #374151;
        background: #ffffff;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 140ms ease;
      }

      .preset:hover {
        border-color: #F97316;
        color: #F97316;
        background: #fff7ed;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(234, 88, 12, 0.12);
      }

      textarea {
        width: 100%;
        box-sizing: border-box;
        min-height: 88px;
        max-height: 220px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 9px 11px;
        color: #111827;
        background: #ffffff;
        font: inherit;
        font-size: 13px;
        line-height: 1.45;
        outline: none;
        resize: vertical;
        transition: border-color 150ms ease, box-shadow 150ms ease;
      }

      .rewrite-direction {
        min-height: 52px;
        max-height: 100px;
      }

      textarea:focus {
        border-color: #F97316;
        box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
      }

      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
      }

      .actions button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        height: 36px;
        border-radius: 10px;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 140ms ease;
      }

      .cancel {
        border: 1px solid #e5e7eb;
        color: #6b7280;
        background: #ffffff;
      }

      .cancel:hover {
        background: #f9fafb;
        color: #374151;
      }

      .rewrite-run,
      .apply {
        border: none;
        color: #ffffff;
        background: linear-gradient(135deg, #EA580C 0%, #F97316 100%);
        box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
      }

      .rewrite-run:hover:not(:disabled),
      .apply:hover:not(:disabled) {
        box-shadow: 0 4px 12px rgba(234, 88, 12, 0.35);
        transform: translateY(-1px);
      }

      .rewrite-run:disabled,
      .apply:disabled {
        background: #e5e7eb;
        color: #9ca3af;
        box-shadow: none;
        cursor: not-allowed;
      }

      @keyframes panel-in {
        from {
          opacity: 0;
          transform: translateY(8px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    
        ${DARK_PANEL_CSS}
    </style>
    <section class="panel" role="dialog" aria-label="${t("rewriteDialogTitle")}">
      <header>
        <div class="icon">${REWRITE_ICON_SVG}</div>
        <h2>${t("rewriteDialogTitle")}</h2>
        <button class="close" type="button" title="${t("closeDialog")}">×</button>
      </header>
      <div class="body">
        <div class="status">${t("chooseDirection")}</div>
        <div class="preset-row" aria-label="${t("rewritePresetsLabel")}">
          <button class="preset" type="button" data-direction="${t("clearerDirection")}">${t("clearer")}</button>
          <button class="preset" type="button" data-direction="${t("shorterDirection")}">${t("shorter")}</button>
          <button class="preset" type="button" data-direction="${t("professionalDirection")}">${t("professional")}</button>
          <button class="preset" type="button" data-direction="${t("friendlierDirection")}">${t("friendlier")}</button>
        </div>
        <div class="label">${t("directionLabel")}</div>
        <textarea class="rewrite-direction" aria-label="${t("directionLabel")}" placeholder="${t("directionPlaceholder")}"></textarea>
        <div class="label">${t("resultLabel")}</div>
        <textarea class="rewrite-output" aria-label="${t("resultLabel")}"></textarea>
        <div class="actions">
          <button class="cancel" type="button">${t("cancel")}</button>
          <button class="rewrite-run" type="button">${REWRITE_ICON_SVG} ${t("rewriteButton")}</button>
          <button class="apply" type="button" disabled>${t("apply")}</button>
        </div>
      </div>
    </section>
  `;

  const close = () => {
    rewriteAbortController?.abort();
    rewriteAbortController = undefined;
    rewriteHost?.remove();
    rewriteHost = undefined;
  };

  shadow.querySelector(".close")?.addEventListener("click", close);
  shadow.querySelector(".cancel")?.addEventListener("click", close);
  shadow.querySelector<HTMLTextAreaElement>(".rewrite-output")?.addEventListener("input", (event) => {
    const applyButton = shadow.querySelector<HTMLButtonElement>(".apply");
    if (applyButton) {
      applyButton.disabled = !(event.currentTarget as HTMLTextAreaElement).value.trim();
    }
  });
  shadow.querySelector(".rewrite-run")?.addEventListener("click", () => {
    void runRewriteFromPanel(rewriteHost!);
  });
  for (const preset of Array.from(shadow.querySelectorAll<HTMLButtonElement>(".preset"))) {
    preset.addEventListener("click", () => {
      const direction = shadow.querySelector<HTMLTextAreaElement>(".rewrite-direction");
      if (direction) {
        direction.value = preset.dataset.direction ?? "";
        direction.focus();
      }
    });
  }
  shadow.querySelector(".apply")?.addEventListener("click", () => {
    const output = shadow.querySelector<HTMLTextAreaElement>(".rewrite-output")?.value ?? "";
    applyReplacement(normalizeReplacementText(output), rewriteOriginalEditable);
    close();
  });

  document.documentElement.append(rewriteHost);
  const directionInput = shadow.querySelector<HTMLTextAreaElement>(".rewrite-direction");
  directionInput?.focus();
  return rewriteHost;
};

const showTransientNotice = (message: string) => {
  const existing = document.getElementById("browerhelper-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "browerhelper-toast";
  toast.style.cssText = "position:fixed;z-index:2147483647;bottom:24px;left:50%;transform:translateX(-50%);pointer-events:auto;";

  const shadow = toast.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .toast {
        padding: 10px 18px;
        border-radius: 10px;
        background: rgba(30, 35, 44, 0.92);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #f1f5f9;
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        animation: toast-in 200ms ease forwards;
        white-space: nowrap;
      }
      @keyframes toast-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    
        ${DARK_PANEL_CSS}
    </style>
    <div class="toast">${message}</div>
  `;

  document.documentElement.append(toast);
  window.setTimeout(() => toast.remove(), 3500);
};

const applyReplacement = (replacementText: string, editable?: EditableSelection) => {
  const target = editable ?? latestEditableSelection;
  const text = replacementText.trim();
  if (!text || !target) {
    return;
  }

  if (target.kind === "text-control") {
    const { element, start, end } = target;
    const value = element.value;
    element.value = `${value.slice(0, start)}${text}${value.slice(end)}`;
    element.focus();
    element.setSelectionRange(start + text.length, start + text.length);
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText", data: text }));
    return;
  }

  const { range, root } = target;
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  root.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText", data: text }));
};

document.addEventListener("selectionchange", () => {
  updateSelection();
  if (latestSelection) {
    scheduleShowFloatingButton();
    return;
  }
  scheduleHideFloatingButton();
});
document.addEventListener("mouseup", scheduleShowFloatingButton);
document.addEventListener("keyup", scheduleShowFloatingButton);
document.addEventListener("contextmenu", scheduleShowFloatingButton);
document.addEventListener(
  "scroll",
  () => {
    hideFloatingButton();
  },
  true
);
window.addEventListener("resize", hideFloatingButton);

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === "GET_SELECTION") {
    updateSelection();
    sendResponse({
      selectionText: latestSelection,
      pageTitle: document.title,
      pageUrl: window.location.href
    });
    return true;
  }

  if (message.type === "APPLY_REPLACEMENT") {
    applyReplacement(message.replacementText);
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

type StreamEvent =
  | { type: "delta"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string };

async function* readSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

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
        yield { type: "error", message: event.error.message };
        return;
      }

      const delta = event.choices?.[0]?.delta?.content;
      if (delta) {
        yield { type: "delta", delta };
      }
    }
  }

  yield { type: "done" };
}

async function getSettings(): Promise<ExtensionSettings> {
  if (!chrome.runtime?.id) {
    throw new Error(t("extensionReloadedNotice"));
  }

  let result: Record<string, unknown>;
  try {
    result = await chrome.storage.local.get(SETTINGS_KEY);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Extension context invalidated")) {
      throw new Error(t("extensionReloadedNotice"));
    }
    throw error;
  }
  const settings = result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined;

  return {
    apiKey: settings?.apiKey?.trim() || "",
    providerBaseUrl: settings?.providerBaseUrl?.trim() || DEFAULT_SETTINGS.providerBaseUrl,
    model: settings?.model?.trim() || DEFAULT_SETTINGS.model,
    language: settings?.language?.trim() || DEFAULT_SETTINGS.language
  };
}

function normalizeReplacementText(content: string): string {
  return content
    .trim()
    .replace(/^```[a-zA-Z0-9_-]*\n?/, "")
    .replace(/\n?```$/, "")
    .replace(/^[“”"](.*)[“”"]$/s, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{3}(.+?)\*{3}/g, "$1")
    .replace(/\*{2}(.+?)\*{2}/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_{3}(.+?)_{3}/g, "$1")
    .replace(/_{2}(.+?)_{2}/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .trim();
}

function buildRewritePrompt(
  selectionText: string,
  options: { direction?: string; previousDraft?: string } = {}
): string {
  const source = document.title || window.location.href
    ? `\n\nSource: ${[document.title, window.location.href].filter(Boolean).join(" - ")}`
    : "";
  const direction = options.direction
    ? `\n\nUser adjustment direction:\n${options.direction}`
    : "\n\nUser adjustment direction:\nRewrite directly with no extra constraints.";
  const previousDraft = options.previousDraft
    ? `\n\nPrevious rewritten draft to improve from:\n${options.previousDraft}`
    : "";

  return `Rewrite the selected text to make it ready to paste back into the original editable field. Preserve the original meaning and language unless the user adjustment direction says otherwise. Return only the rewritten text, with no explanation, no markdown fences, and no surrounding quotes.${source}\n\nOriginal selected text:\n${selectionText}${previousDraft}${direction}`;
}

function isSelectableTextControl(element: Element | null): element is HTMLInputElement | HTMLTextAreaElement {
  if (element instanceof HTMLTextAreaElement) {
    return !element.readOnly && !element.disabled;
  }

  if (!(element instanceof HTMLInputElement) || element.readOnly || element.disabled) {
    return false;
  }

  return ["", "text", "search", "url", "tel", "email", "password"].includes(element.type);
}

function getEditableRoot(node: Node | null): HTMLElement | undefined {
  const element = node instanceof Element ? node : node?.parentElement;
  const root = element?.closest<HTMLElement>('[contenteditable="true"], [contenteditable="plaintext-only"]');
  if (!root || !root.isContentEditable) {
    return undefined;
  }
  return root;
}

function renderMarkdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Bold
  html = html.replace(/\*{3}(.+?)\*{3}/g, "<strong>$1</strong>");
  html = html.replace(/\*{2}(.+?)\*{2}/g, "<strong>$1</strong>");
  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  // Headers
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/((<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  // Paragraphs
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = "<p>" + html + "</p>";
  html = html.replace(/<p>\s*<(h[1-4]|ul|pre)/g, "<$1");
  html = html.replace(/<\/(h[1-4]|ul|pre)>\s*<\/p>/g, "</$1>");
  html = html.replace(/<p>\s*<\/p>/g, "");
  // Line breaks within paragraphs
  html = html.replace(/\n/g, "<br>");

  return html;
}
