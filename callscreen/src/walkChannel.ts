export const WALK_CHANNEL = "callscreen.live-apply";
export const WALK_STORAGE = "callscreen.pending-live-apply";

export type Walkthrough = {
  candidateId: string;
  roleId: string;
  name: string;
};

export function publishWalkthrough(msg: Walkthrough) {
  localStorage.setItem(WALK_STORAGE, JSON.stringify(msg));
  const channel = new BroadcastChannel(WALK_CHANNEL);
  channel.postMessage(msg);
  channel.close();
}

export function consumeWalkthrough(): Walkthrough | null {
  const raw = localStorage.getItem(WALK_STORAGE);
  if (!raw) return null;
  localStorage.removeItem(WALK_STORAGE);
  try {
    return JSON.parse(raw) as Walkthrough;
  } catch {
    return null;
  }
}
