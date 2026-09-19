import { useState } from "react";

const LinkIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 013.5 3.5l-1 1M9 11.5l-1 1A2.5 2.5 0 014.5 9l1-1" /></svg>
);
const OpenIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3.5H3.5v9h9V10M9.5 3h3.5v3.5M13 3L7.5 8.5" /></svg>
);

/** The role's public application URL. Click copies, the arrow opens it. */
export function ApplyLink({ slug }: { slug: string }) {
  const url = `${location.origin}/apply/${slug}`;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard blocked */ }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };
  return (
    <span className="applylink">
      <button className="btn" onClick={copy} title={`Copy ${url}`}><LinkIcon />{copied ? "Copied" : `apply/${slug}`}</button>
      <a className="btn icon" href={url} target="_blank" rel="noreferrer" title="Open application page" aria-label="Open application page"><OpenIcon /></a>
    </span>
  );
}
