import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-page">
      <p className="eyebrow">404</p>
      <h1>Nothing here just yet.</h1>
      <p>This page could not be found.</p>
      <Link className="button primary" href="/">
        Back to workspace
      </Link>
    </div>
  );
}
