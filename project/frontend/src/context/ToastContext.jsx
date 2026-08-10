import { createContext, useContext, useState, useCallback } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "success", duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
    return id;
  }, [removeToast]);

  const success = useCallback((msg, duration) => addToast(msg, "success", duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, "error", duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, "info", duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, "warning", duration), [addToast]);

  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast,
        success,
        error,
        info,
        warning,
        toast: { success, error, info, warning },
      }}
    >
      {children}
      {/* Global Floating Toast Popup Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-bounce-short ${
              t.type === "success"
                ? "bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-900/20"
                : t.type === "error"
                ? "bg-slate-900/95 text-white border-rose-500/40 shadow-rose-900/20"
                : t.type === "warning"
                ? "bg-slate-900/95 text-white border-amber-500/40 shadow-amber-900/20"
                : "bg-slate-900/95 text-white border-sky-500/40 shadow-sky-900/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl flex items-center justify-center ${
                  t.type === "success"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : t.type === "error"
                    ? "bg-rose-500/20 text-rose-400"
                    : t.type === "warning"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-sky-500/20 text-sky-400"
                }`}
              >
                {t.type === "success" && <FiCheckCircle className="text-xl" />}
                {t.type === "error" && <FiAlertCircle className="text-xl" />}
                {t.type === "warning" && <FiAlertCircle className="text-xl" />}
                {t.type === "info" && <FiInfo className="text-xl" />}
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-gray-100">{t.message}</p>
                <p className="text-[11px] text-gray-400">Action completed successfully</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log("Toast success:", msg),
      error: (msg) => console.error("Toast error:", msg),
      info: (msg) => console.log("Toast info:", msg),
      warning: (msg) => console.warn("Toast warning:", msg),
      toast: {
        success: (msg) => console.log("Toast success:", msg),
        error: (msg) => console.error("Toast error:", msg),
        info: (msg) => console.log("Toast info:", msg),
        warning: (msg) => console.warn("Toast warning:", msg),
      },
    };
  }
  return context;
}

export default ToastContext;
