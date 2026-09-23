import { useState } from 'react';

interface Props {
  link: string;
}

export default function CopyLinkButton({ link }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard API unavailable — the link text is still visible to copy manually.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="copy-link">
      <code title={link}>{link}</code>
      <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="2" />
        </svg>
        Copy Link
      </button>
      {copied && (
        <span role="status" className="copy-confirmation">
          Link copied
        </span>
      )}
    </div>
  );
}
