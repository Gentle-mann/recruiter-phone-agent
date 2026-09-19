import type { CallStatus } from "@/lib/types";

const labels: Record<CallStatus, string> = {
  completed: "Brief ready",
  "no-answer": "No answer",
  "opted-out": "Opted out",
};
export function StatusBadge({ status }: { status: CallStatus }) {
  return (
    <span className={`status status-${status}`}>
      <span />
      {labels[status]}
    </span>
  );
}
