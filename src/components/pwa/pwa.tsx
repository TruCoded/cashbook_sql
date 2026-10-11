"use client";

import { useEffect, useState } from "react";
import { Download, Share, X, SquarePlus } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "cashbook-install-dismissed";
const DISMISS_DAYS = 7;

function recentlyDismissed() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return t && Date.now() - t < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Registers the service worker and shows the "install app" popup on phones. */
export function PwaRoot() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (isStandalone() || recentlyDismissed()) return;

    // Android / Chrome: the browser tells us the app is installable.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 2500);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iPhone / iPad Safari has no install event, so show manual steps instead.
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIos && isSafari) {
      t = setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 3500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (t) clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode: just hide for this visit */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setVisible(false);
    else dismiss();
  };

  if (!visible || (!deferred && !iosHint)) return null;

  return (
    <div role="dialog" aria-label="Install Cashbook" className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="rounded-2xl bg-surface border border-border p-4 shadow-[0_10px_30px_rgba(70,86,140,0.25)]">
        <div className="flex items-start justify-between gap-3">
          <Logo markClassName="h-9 w-9" />
          <button onClick={dismiss} aria-label="Not now" className="p-1 -m-1 rounded-md text-muted hover:bg-surface-2">
            <X size={18} />
          </button>
        </div>
        <p className="font-serif text-lg font-semibold text-primary mt-3">Install the Cashbook app</p>
        <p className="text-sm text-muted mt-1">Open it from your home screen like any app — full screen, quick to launch, and it shows up in your recent apps.</p>

        {deferred ? (
          <div className="flex gap-2 mt-4">
            <Button onClick={install} className="flex-1 uppercase text-[13px]">
              <Download size={16} /> Install
            </Button>
            <Button variant="ghost" onClick={dismiss}>Not now</Button>
          </div>
        ) : (
          <ol className="mt-3 flex flex-col gap-2 text-sm">
            <li className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-full bg-surface-2 flex items-center justify-center text-primary shrink-0"><Share size={14} /></span>
              Tap the <b>Share</b> button in Safari
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-full bg-surface-2 flex items-center justify-center text-primary shrink-0"><SquarePlus size={14} /></span>
              Choose <b>Add to Home Screen</b>
            </li>
          </ol>
        )}
      </div>
    </div>
  );
}
