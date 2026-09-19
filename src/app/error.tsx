"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-page">
      <h1>Something went wrong.</h1>
      <p>Try loading the workspace again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
