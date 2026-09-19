import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { DemoProvider } from "@/components/demo-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Firstcall · Recruiter workspace",
    template: "%s · Firstcall",
  },
  description:
    "A recruiter phone-screen assistant. Hackathon scaffold with fictional demo data.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DemoProvider>
          <AppShell>{children}</AppShell>
        </DemoProvider>
      </body>
    </html>
  );
}
