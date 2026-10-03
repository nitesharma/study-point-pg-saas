"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalOverlayProps {
  children: React.ReactNode;
  /** Backdrop tint classes, e.g. "bg-slate-900/50" */
  tone?: string;
  onClose?: () => void;
  /** Close when the backdrop is clicked. Leave off for forms so a stray click doesn't discard input. */
  dismissOnBackdrop?: boolean;
}

/**
 * Renders a modal into document.body so it is always centered in the viewport,
 * regardless of the scroll position or styling of the view that opened it.
 * Tall content scrolls inside the overlay instead of being clipped at the top.
 */
export default function ModalOverlay({ children, tone = "bg-slate-900/50", onClose, dismissOnBackdrop = false }: ModalOverlayProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Modals are only opened in response to user actions, never during server render.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] overflow-y-auto backdrop-blur-sm animate-fade-in ${tone}`}
      role="dialog"
      data-modal-overlay=""
      aria-modal="true"
      onMouseDown={(e) => {
        if (dismissOnBackdrop && onClose && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex min-h-full w-full items-center justify-center p-4 sm:p-6"
        onMouseDown={(e) => {
          if (dismissOnBackdrop && onClose && e.target === e.currentTarget) onClose();
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
