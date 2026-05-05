"use client";

/**
 * Removes marketing / linker query params from the visible URL after load so shared links
 * stay clean (e.g. ?_gl=… from GA cross-domain linker). Runs after a short delay so gtag
 * can read params first.
 */
import { useEffect } from "react";

const PARAMS_TO_STRIP = [
  "_gl",
  "_ga",
  "_gid",
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

export function CleanUrlParams() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        let changed = false;
        for (const p of PARAMS_TO_STRIP) {
          if (url.searchParams.has(p)) {
            url.searchParams.delete(p);
            changed = true;
          }
        }
        if (changed) {
          const next = url.pathname + (url.search ? url.search : "") + url.hash;
          window.history.replaceState(window.history.state, "", next);
        }
      } catch {
        /* ignore invalid URL edge cases */
      }
    }, 250);

    return () => window.clearTimeout(id);
  }, []);

  return null;
}
