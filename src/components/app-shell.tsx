"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  LayoutDashboard,
  Phone,
  Plug,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/roles/new", label: "Role setup", icon: BriefcaseBusiness },
  { href: "/candidate", label: "Candidate preview", icon: Phone },
  { href: "/integrations", label: "Integrations", icon: Plug },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Firstcall home">
          <span className="brand-icon">
            <Phone size={19} />
          </span>
          firstcall<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-chip">
          <span className="workspace-avatar">N</span>
          <div>
            <strong>Northstar Studio</strong>
            <small>Demo workspace</small>
          </div>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/" || pathname.startsWith("/interviews")
                : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={active ? "nav-link active" : "nav-link"}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sparkles size={18} />
            <strong>A thoughtful first conversation.</strong>
            <p>Make room for the people behind every application.</p>
          </div>
          <a
            className="repo-link"
            href="https://github.com/Gentle-mann/recruiter-phone-agent"
            target="_blank"
            rel="noreferrer"
          >
            Project repository
            <ArrowUpRight size={14} />
          </a>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span>
            Recruiting / <strong>Workspace</strong>
          </span>
          <span className="demo-badge">
            <span />
            Demo mode
          </span>
        </header>
        <main id="main">{children}</main>
        <footer className="footer">
          Fictional sample data · Session changes reset on refresh · No real
          calls
        </footer>
      </div>
    </div>
  );
}
