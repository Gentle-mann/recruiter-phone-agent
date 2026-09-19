import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { DataApi } from "../types";

/** Live mode: every read is a Convex subscription, every action a mutation. */
export function useConvexData(): DataApi {
  const advance = useMutation(api.candidates.advance);
  const reject = useMutation(api.candidates.reject);
  const setTaken = useMutation(api.candidates.setTaken);
  const addNote = useMutation(api.candidates.addNote);
  const create = useMutation(api.roles.create);

  return useMemo<DataApi>(() => ({
    mode: "live",
    useRoles: () => useQuery(api.roles.list),
    useCandidates: (roleId) => useQuery(api.candidates.listByRole, { roleId: roleId as Id<"roles"> }),
    useCandidate: (id) => useQuery(api.candidates.get, id ? { id: id as Id<"candidates"> } : "skip"),
    advance: (id) => advance({ id: id as Id<"candidates"> }).then(() => {}),
    reject: (id) => reject({ id: id as Id<"candidates"> }).then(() => {}),
    setTaken: (id, taken) => setTaken({ id: id as Id<"candidates">, taken }).then(() => {}),
    addNote: (id, text) => addNote({ id: id as Id<"candidates">, text }).then(() => {}),
    createRole: async (r) => create(r),
  }), [advance, reject, setTaken, addNote, create]);
}
