import { useState } from "react";

/** The role's public application URL with one-click copy. */
export function ApplyLink({ slug }: { slug: string }) {
  const url = `${location.origin}/apply/${slug}`;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard blocked, the text is still selectable */ }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="applylink">
      <span className="applylink-label">Application link</span>
      <code onClick={copy} title="Click to copy">{url.replace(/^https?:\/\//, "")}</code>
      <button className="btn" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
      <a className="btn" href={url} target="_blank" rel="noreferrer">Open</a>
    </div>
  );
}
