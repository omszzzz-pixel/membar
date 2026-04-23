"use client";

import { useEffect } from "react";

let lockCount = 0;
let savedScrollY = 0;

export function useLockBodyScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        window.scrollTo(0, savedScrollY);
      }
    };
  }, []);
}
