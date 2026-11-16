// Browser helpers around the Telegram Mini App SDK (window.Telegram.WebApp).
type WebApp = {
  initData: string;
  ready?: () => void;
  expand?: () => void;
  openLink?: (url: string) => void;
  openTelegramLink?: (url: string) => void;
  HapticFeedback?: { notificationOccurred: (t: "success" | "error" | "warning") => void; impactOccurred: (s: string) => void };
};

export function webApp(): WebApp | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { Telegram?: { WebApp?: WebApp } }).Telegram?.WebApp ?? null;
}

export function getInitData(): string {
  return webApp()?.initData ?? "";
}

export function openExternal(url: string) {
  const tg = webApp();
  if (tg?.initData) {
    if (/^https:\/\/t\.me\//.test(url) && tg.openTelegramLink) return tg.openTelegramLink(url);
    if (tg.openLink) return tg.openLink(url);
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function shareLink(url: string, text: string) {
  openExternal(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
}

export function haptic(type: "success" | "error") {
  webApp()?.HapticFeedback?.notificationOccurred(type);
}
