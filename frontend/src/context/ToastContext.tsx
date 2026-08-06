import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import ToastContainer from "../components/ToastContainer";

import type {
  ToastMessage,
  ToastType,
} from "../components/Toast";

type ShowToastOptions = {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
};

type ToastContextValue = {
  showToast: (
    options: ShowToastOptions,
  ) => void;
  removeToast: (id: number) => void;
};

type ToastProviderProps = {
  children: React.ReactNode;
};

const ToastContext =
  createContext<ToastContextValue | null>(
    null,
  );

function ToastProvider({
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<
    ToastMessage[]
  >([]);

  const removeToast = useCallback(
    (id: number) => {
      setToasts((currentToasts) =>
        currentToasts.filter(
          (toast) => toast.id !== id,
        ),
      );
    },
    [],
  );

  const showToast = useCallback(
    ({
      title,
      message,
      type = "info",
      duration = 3500,
    }: ShowToastOptions) => {
      const id =
        Date.now() +
        Math.floor(Math.random() * 1000);

      const newToast: ToastMessage = {
        id,
        title,
        message,
        type,
      };

      setToasts((currentToasts) => [
        ...currentToasts,
        newToast,
      ]);

      window.setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast],
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      removeToast,
    }),
    [showToast, removeToast],
  );

  return (
    <ToastContext.Provider
      value={contextValue}
    >
      {children}

      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
      />
    </ToastContext.Provider>
  );
}

function useToast() {
  const context =
    useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used inside ToastProvider.",
    );
  }

  return context;
}

export {
  ToastProvider,
  useToast,
};
