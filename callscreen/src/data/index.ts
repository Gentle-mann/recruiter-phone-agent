import { createContext, useContext } from "react";
import type { DataApi, Mode } from "../types";

export const DataContext = createContext<{ data: DataApi; mode: Mode; setMode: (m: Mode) => void } | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData outside DataContext");
  return ctx;
}
