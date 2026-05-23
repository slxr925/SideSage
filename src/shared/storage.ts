import {
  DEFAULT_SETTINGS,
  PENDING_REQUEST_KEY,
  SETTINGS_KEY,
  type ExtensionSettings,
  type PanelRequest
} from "./messages";

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettings({
    ...DEFAULT_SETTINGS,
    ...(result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined)
  });
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: normalizeSettings(settings) });
}

export async function getPendingRequest(): Promise<PanelRequest | undefined> {
  const result = await chrome.storage.session.get(PENDING_REQUEST_KEY);
  return result[PENDING_REQUEST_KEY] as PanelRequest | undefined;
}

export async function savePendingRequest(request: PanelRequest): Promise<void> {
  await chrome.storage.session.set({ [PENDING_REQUEST_KEY]: request });
}

export async function clearPendingRequest(requestId: string): Promise<void> {
  const current = await getPendingRequest();
  if (!current || current.id === requestId) {
    await chrome.storage.session.remove(PENDING_REQUEST_KEY);
  }
}

function normalizeSettings(settings: Partial<ExtensionSettings>): ExtensionSettings {
  return {
    apiKey: settings.apiKey?.trim() || "",
    providerBaseUrl: settings.providerBaseUrl?.trim() || DEFAULT_SETTINGS.providerBaseUrl,
    model: settings.model?.trim() || DEFAULT_SETTINGS.model,
    language: settings.language?.trim() || DEFAULT_SETTINGS.language
  };
}
