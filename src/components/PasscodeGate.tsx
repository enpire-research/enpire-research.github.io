"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

/*
 * Lightweight passcode gate for the static site.
 *
 * NOTE — this is casual obscurity, NOT real security. GitHub Pages serves only
 * static files, so the page's JS bundle and every asset under /videos and
 * /public remain directly fetchable by URL regardless of this gate. A
 * determined visitor can bypass it. It only keeps the page from being read or
 * indexed by someone who lands on it without the code. For real access control,
 * put the site behind an auth layer (e.g. Cloudflare Access).
 *
 * To change the passcode, regenerate the hash:
 *   printf '%s' "your-new-passcode" | shasum -a 256
 * and paste the hex digest into PASSCODE_SHA256 below.
 */
const PASSCODE_SHA256 = "1a527453938e5becb94d5ca6a26b434c99318687fa5a6ac23e94d53bbcaab3dc";
const STORAGE_KEY = "enpire-access-granted";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function PasscodeGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === PASSCODE_SHA256) {
        setUnlocked(true);
      }
    } catch {
      /* localStorage unavailable — fall through to the prompt */
    }
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setChecking(true);
    setError(false);
    const hash = await sha256Hex(value);
    if (hash === PASSCODE_SHA256) {
      try {
        window.localStorage.setItem(STORAGE_KEY, hash);
      } catch {
        /* ignore persistence failure; unlock for this session anyway */
      }
      setUnlocked(true);
    } else {
      setError(true);
      setValue("");
    }
    setChecking(false);
  };

  // Before mount the prerendered HTML shows the gate (so the article markup is
  // not baked into index.html); after mount we reveal if already authorized.
  if (mounted && unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="passcode-gate" data-ready={mounted}>
      <form className="passcode-gate__card" onSubmit={handleSubmit}>
        <h1 className="passcode-gate__title">ENPIRE</h1>
        <p className="passcode-gate__hint">This preview is private. Enter the passcode to continue.</p>
        <input
          aria-label="Passcode"
          autoComplete="off"
          autoFocus
          className="passcode-gate__input"
          data-error={error}
          onChange={(event) => {
            setValue(event.currentTarget.value);
            if (error) setError(false);
          }}
          placeholder="Passcode"
          type="password"
          value={value}
        />
        {error ? <p className="passcode-gate__error">Incorrect passcode. Try again.</p> : null}
        <button className="passcode-gate__submit" disabled={checking || !value} type="submit">
          {checking ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
