import {
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";

export type ToastType =
  | "success"
  | "error"
  | "warning"
  | "info";

export type ToastMessage = {
  id: number;
  title: string;
  message?: string;
  type: ToastType;
};

type ToastProps = {
  toast: ToastMessage;
  onClose: (id: number) => void;
};

function Toast({
  toast,
  onClose,
}: ToastProps) {
  const styles = getToastStyles(
    toast.type,
  );

  const Icon = styles.icon;

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm rounded-xl border p-4 shadow-2xl backdrop-blur ${styles.containerClass}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-lg p-2 ${styles.iconBackgroundClass}`}
        >
          <Icon
            className={`h-5 w-5 ${styles.iconClass}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`font-semibold ${styles.titleClass}`}
          >
            {toast.title}
          </p>

          {toast.message && (
            <p className="mt-1 text-sm leading-5 text-slate-300">
              {toast.message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            onClose(toast.id)
          }
          className="rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type ToastStyles = {
  icon: typeof CheckCircle2;
  containerClass: string;
  iconBackgroundClass: string;
  iconClass: string;
  titleClass: string;
};

function getToastStyles(
  type: ToastType,
): ToastStyles {
  if (type === "success") {
    return {
      icon: CheckCircle2,
      containerClass:
        "border-green-500/30 bg-slate-950/95",
      iconBackgroundClass:
        "bg-green-500/15",
      iconClass: "text-green-400",
      titleClass: "text-green-300",
    };
  }

  if (type === "error") {
    return {
      icon: XCircle,
      containerClass:
        "border-red-500/30 bg-slate-950/95",
      iconBackgroundClass:
        "bg-red-500/15",
      iconClass: "text-red-400",
      titleClass: "text-red-300",
    };
  }

  if (type === "warning") {
    return {
      icon: TriangleAlert,
      containerClass:
        "border-amber-500/30 bg-slate-950/95",
      iconBackgroundClass:
        "bg-amber-500/15",
      iconClass: "text-amber-400",
      titleClass: "text-amber-300",
    };
  }

  return {
    icon: Info,
    containerClass:
      "border-blue-500/30 bg-slate-950/95",
    iconBackgroundClass:
      "bg-blue-500/15",
    iconClass: "text-blue-400",
    titleClass: "text-blue-300",
  };
}

export default Toast;
