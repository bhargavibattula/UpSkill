"use client";
import { useToast } from "@/lib/hooks/use-toast";
import { CheckCircle, XCircle, X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none" style={{ maxWidth: '380px' }}>
      {toasts.map((t) => {
        const isError = t.variant === "destructive";
        const accentColor = isError ? "#ef4444" : "#22c55e";

        return (
          <div
            key={t.id}
            className="pointer-events-auto relative bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-[slideDown_0.3s_ease-out]"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              {isError ? (
                <XCircle className="w-6 h-6 flex-shrink-0" fill="#ef4444" stroke="white" />
              ) : (
                <CheckCircle className="w-6 h-6 flex-shrink-0" fill="#22c55e" stroke="white" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 leading-snug">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[3px] w-full" style={{ backgroundColor: accentColor }} />
          </div>
        );
      })}
    </div>
  );
}
