"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { initialInterviews } from "@/lib/fixtures";
import type { Interview, Role } from "@/lib/types";

interface DemoWorkspace {
  interviews: Interview[];
  drafts: Role[];
  addInterview: (interview: Interview) => void;
  addDraft: (role: Role) => void;
}

const DemoContext = createContext<DemoWorkspace | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [interviews, setInterviews] = useState(initialInterviews);
  const [drafts, setDrafts] = useState<Role[]>([]);
  return (
    <DemoContext.Provider
      value={{
        interviews,
        drafts,
        addInterview: (interview) =>
          setInterviews((current) => [interview, ...current]),
        addDraft: (role) => setDrafts((current) => [role, ...current]),
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoWorkspace() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("DemoProvider is required.");
  return context;
}
