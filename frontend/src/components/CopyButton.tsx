import {
  Check,
  Copy,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className = "",
}: CopyButtonProps) {
  const [isCopied, setIsCopied] =
    useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        setIsCopied(false);
      },
      1800,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isCopied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        value,
      );

      setIsCopied(true);
    } catch {
      const temporaryTextArea =
        document.createElement("textarea");

      temporaryTextArea.value = value;
      temporaryTextArea.style.position =
        "fixed";
      temporaryTextArea.style.left =
        "-9999px";
      temporaryTextArea.style.opacity =
        "0";

      document.body.appendChild(
        temporaryTextArea,
      );

      temporaryTextArea.focus();
      temporaryTextArea.select();

      document.execCommand("copy");

      document.body.removeChild(
        temporaryTextArea,
      );

      setIsCopied(true);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      title={`Copy ${value}`}
      aria-label={`Copy ${value}`}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        isCopied
          ? "border-green-500/40 bg-green-500/10 text-green-300"
          : "border-slate-600 bg-slate-900/60 text-slate-300 hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-300"
      } ${className}`}
    >
      {isCopied ? (
        <>
          <Check className="h-4 w-4" />
          {copiedLabel}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}

export default CopyButton;
