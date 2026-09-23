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
      <code>{link}</code>
      <button type="button" onClick={handleCopy}>
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
