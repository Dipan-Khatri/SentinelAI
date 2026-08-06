import Toast, {
  type ToastMessage,
} from "./Toast";

type ToastContainerProps = {
  toasts: ToastMessage[];
  onClose: (id: number) => void;
};

function ToastContainer({
  toasts,
  onClose,
}: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[100] flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

export default ToastContainer; 