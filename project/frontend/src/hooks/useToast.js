import { useState, useCallback } from "react";

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message, duration = 4000) => addToast(message, "success", duration),
    [addToast]
  );

  const error = useCallback(
    (message, duration = 5000) => addToast(message, "error", duration),
    [addToast]
  );

  const warning = useCallback(
    (message, duration = 4500) => addToast(message, "warning", duration),
    [addToast]
  );

  const info = useCallback(
    (message, duration = 4000) => addToast(message, "info", duration),
    [addToast]
  );

  return { toasts, addToast, removeToast, success, error, warning, info };
};
