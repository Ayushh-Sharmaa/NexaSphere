import { useState } from "react";
import { AdminIcon } from "./AdminIcon";

export function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const sanitizedText = String(text || "").replace(
        /[\x00-\x08\x0B\x0C\x0D\x0E-\x1F\x7F-\x9F]/g,
        ""
      );
      await navigator.clipboard.writeText(sanitizedText);
      await navigator.clipboard.writeText(text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="copy-btn"
      aria-label={`Copy ${label}`}
    >
      <AdminIcon
        name={copied ? "Check" : "Copy"}
        size={14}
        aria-hidden="true"
      />

      {copied ? "Copied!" : label}
    </button>
  );
}
