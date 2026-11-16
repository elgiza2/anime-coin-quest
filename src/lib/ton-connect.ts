import type { TonConnectUI } from "@tonconnect/ui";

// Browser-only singleton, loaded lazily so the wallet library never runs during SSR.
let instance: Promise<TonConnectUI> | null = null;

export function getTonConnect(): Promise<TonConnectUI> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("TON Connect is only available in the browser"));
  }
  if (!instance) {
    instance = import("@tonconnect/ui").then(({ TonConnectUI, THEME }) => {
      const ui = new TonConnectUI({
        manifestUrl: `${window.location.origin}/api/public/tonconnect-manifest`,
      });
      ui.uiOptions = { uiPreferences: { theme: THEME.DARK } };
      return ui;
    });
  }
  return instance;
}

export async function shortTonAddress(raw: string): Promise<string> {
  const { toUserFriendlyAddress } = await import("@tonconnect/ui");
  const friendly = toUserFriendlyAddress(raw);
  return `${friendly.slice(0, 4)}…${friendly.slice(-4)}`;
}
