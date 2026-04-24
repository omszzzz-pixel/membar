"use client";

import { useEffect } from "react";

let lockCount = 0;
let savedScrollY = 0;

function applyLock() {
  savedScrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${savedScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function releaseLock() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo(0, savedScrollY);
}

// Safety net: if the tab is backgrounded or the window loses focus while a lock
// is active, some mobile browsers can end up with the body stuck in fixed mode.
// Clear all locks on visibility/pageshow events so the user never gets trapped.
if (typeof window !== "undefined") {
  const hardReset = () => {
    if (lockCount > 0 && document.hidden) {
      lockCount = 0;
      releaseLock();
    }
  };
  window.addEventListener("pageshow", () => {
    if (lockCount === 0 && document.body.style.position === "fixed") {
      // Body got left in fixed mode somehow (back-forward cache etc.)
      releaseLock();
    }
  });
  document.addEventListener("visibilitychange", hardReset);
}

export function useLockBodyScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (lockCount === 0) {
      applyLock();
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        releaseLock();
      }
    };
  }, []);
}
