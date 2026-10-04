"use client";

import { useEffect, useState } from "react";

type PwaState = {
  online: boolean;
  updateAvailable: boolean;
  installAvailable: boolean;
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export function PwaRuntime() {
  const [state, setState] = useState<PwaState>({
    online: true,
    updateAvailable: false,
    installAvailable: false,
  });
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setState((current) => ({ ...current, online: navigator.onLine }));

    const handleOnline = () => setState((current) => ({ ...current, online: true }));
    const handleOffline = () => setState((current) => ({ ...current, online: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!("serviceWorker" in navigator)) {
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    let disposed = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        if (registration.waiting && navigator.serviceWorker.controller) {
          setState((current) => ({ ...current, updateAvailable: true }));
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (!disposed && worker.state === "installed" && navigator.serviceWorker.controller) {
              setState((current) => ({ ...current, updateAvailable: true }));
            }
          });
        });

        const updateInterval = window.setInterval(() => {
          void registration.update();
        }, 30 * 60 * 1000);

        return () => window.clearInterval(updateInterval);
      } catch {
        // PWA enhancement is optional; the web app remains usable without a service worker.
      }
    };

    void register();

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      disposed = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  useEffect(() => {
    const handleInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallEvent(event);
      setState((current) => ({ ...current, installAvailable: true }));
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setState((current) => ({ ...current, installAvailable: false }));
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
    setState((current) => ({ ...current, installAvailable: false }));
  };

  const update = () => {
    navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
  };

  if (state.online && !state.updateAvailable && !state.installAvailable) return null;

  return (
    <div className="pwa-runtime-banner" role="status" aria-live="polite">
      <div className="pwa-runtime-message">
        {!state.online ? (
          <>
            <strong>Offline</strong>
            <span>Allpha tetap dapat dibuka, tetapi aksi server tidak akan dijalankan sampai koneksi kembali.</span>
          </>
        ) : state.updateAvailable ? (
          <>
            <strong>Pembaruan Allpha tersedia</strong>
            <span>Muat versi terbaru untuk melanjutkan.</span>
          </>
        ) : (
          <>
            <strong>Pasang Allpha</strong>
            <span>Gunakan Allpha sebagai aplikasi di perangkat ini.</span>
          </>
        )}
      </div>

      <div className="pwa-runtime-actions">
        {state.updateAvailable ? (
          <button type="button" className="pwa-runtime-button" onClick={update}>
            Perbarui
          </button>
        ) : state.installAvailable ? (
          <button type="button" className="pwa-runtime-button" onClick={() => void install()}>
            Pasang
          </button>
        ) : null}
      </div>
    </div>
  );
}
