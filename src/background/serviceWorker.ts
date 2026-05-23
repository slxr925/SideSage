import {
  PENDING_REQUEST_KEY,
  type PanelRequest,
  type PromptMode,
  type RuntimeMessage,
  type SelectionSnapshot
} from "../shared/messages";
import { t, loadLocaleFromStorage, LOCALE_KEY } from "../shared/i18n";

const menuModeIds: PromptMode[] = ["ask", "summarize", "translate", "explain", "rewrite"];

const menuTitleKey: Record<PromptMode, "askBrowerHelper" | "summarizeBrowerHelper" | "translateBrowerHelper" | "explainBrowerHelper" | "rewriteBrowerHelper"> = {
  ask: "askBrowerHelper",
  summarize: "summarizeBrowerHelper",
  translate: "translateBrowerHelper",
  explain: "explainBrowerHelper",
  rewrite: "rewriteBrowerHelper"
};

function buildContextMenus() {
  chrome.contextMenus.removeAll(() => {
    for (const mode of menuModeIds) {
      chrome.contextMenus.create({
        id: mode,
        title: t(menuTitleKey[mode]),
        contexts: ["selection"]
      });
    }
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  await loadLocaleFromStorage();
  buildContextMenus();

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Older Chrome versions may not support this.
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[LOCALE_KEY]) {
    const newLocale = changes[LOCALE_KEY].newValue;
    if (newLocale === "en" || newLocale === "zh") {
      void loadLocaleFromStorage().then(() => buildContextMenus());
    }
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const mode = info.menuItemId as PromptMode;
  if (!isPromptMode(mode) || !tab?.id) {
    return;
  }

  void openPanelWithRequest(tab, {
    mode,
    selectionText: info.selectionText?.trim() ?? "",
    pageTitle: tab.title,
    pageUrl: tab.url
  });
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  if (message.type === "GET_PENDING_REQUEST") {
    chrome.storage.session.get(PENDING_REQUEST_KEY).then(sendResponse);
    return true;
  }

  if (message.type === "ACK_PENDING_REQUEST") {
    chrome.storage.session.get(PENDING_REQUEST_KEY).then((result) => {
      const current = result[PENDING_REQUEST_KEY] as PanelRequest | undefined;
      if (!current || current.id === message.requestId) {
        chrome.storage.session.remove(PENDING_REQUEST_KEY).then(() => sendResponse({ ok: true }));
        return;
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "OPEN_PANEL_WITH_CURRENT_SELECTION" && typeof sender.tab?.id === "number") {
    const tab = sender.tab;
    const tabId = tab.id as number;
    getSelectionFromTab(tabId).then((snapshot) => {
      openPanelWithRequest(tab, {
        mode: message.mode,
        selectionText: snapshot.selectionText,
        pageTitle: snapshot.pageTitle || tab.title,
        pageUrl: snapshot.pageUrl || tab.url
      })
        .then((result) => sendResponse(result))
        .catch((error) => sendResponse({ ok: false, error: String(error) }));
    });
    return true;
  }

  if (message.type === "OPEN_PANEL_WITH_SELECTION" && sender.tab?.windowId) {
    const tab = sender.tab;
    openPanelWithRequest(tab, {
      mode: message.mode,
      selectionText: message.selectionText,
      extraPrompt: message.extraPrompt,
      pageTitle: message.pageTitle || tab.title,
      pageUrl: message.pageUrl || tab.url,
      isEditable: message.isEditable
    })
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "REPLACE_SELECTION") {
    chrome.tabs
      .sendMessage(message.tabId, {
        type: "APPLY_REPLACEMENT",
        replacementText: message.replacementText
      } satisfies RuntimeMessage)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  return false;
});

async function openPanelWithRequest(
  tab: chrome.tabs.Tab,
  input: Omit<PanelRequest, "id" | "createdAt">
): Promise<{ ok: boolean; panelOpened: boolean; error?: string }> {
  const request: PanelRequest = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    tabId: tab.id,
    ...input
  };

  const openOptions = typeof tab.id === "number"
    ? ({ tabId: tab.id } as Parameters<typeof chrome.sidePanel.open>[0])
    : ({ windowId: tab.windowId } as Parameters<typeof chrome.sidePanel.open>[0]);
  const openPromise = chrome.sidePanel.open(openOptions);
  await chrome.storage.session.set({ [PENDING_REQUEST_KEY]: request });

  try {
    await openPromise;
    return { ok: true, panelOpened: true };
  } catch (error) {
    return { ok: true, panelOpened: false, error: String(error) };
  }
}

async function getSelectionFromTab(tabId: number): Promise<SelectionSnapshot> {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: "GET_SELECTION" } satisfies RuntimeMessage);
  } catch {
    return { selectionText: "" };
  }
}

function isPromptMode(value: string): value is PromptMode {
  return (
    value === "ask" ||
    value === "summarize" ||
    value === "translate" ||
    value === "explain" ||
    value === "rewrite"
  );
}
