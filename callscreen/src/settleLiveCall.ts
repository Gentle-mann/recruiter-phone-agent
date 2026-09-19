type LiveTurn = { id: string; label: string; prompt: string; answer?: string | null };

/** Move a live candidate to scored after the call. Falls back to advance if scoring is unavailable. */
export async function settleLiveCall(
  id: string,
  latest: { turns: LiveTurn[] },
  durationSeconds: number,
  screen: (id: string) => Promise<void>,
  complete?: (id: string, result: { turns: LiveTurn[]; callDur: number }) => Promise<void>,
) {
  try {
    if (complete && latest.turns.length) {
      await complete(id, { turns: latest.turns, callDur: durationSeconds });
      return;
    }
  } catch {
    /* completeScreen may not be on the Convex deployment yet */
  }
  await screen(id);
}
