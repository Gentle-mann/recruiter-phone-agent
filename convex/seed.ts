import { internalMutation } from "./_generated/server";
import { makeCandidate, NAMES, rng, STAGES, type Stage } from "./content";

const ROLES = [
  { name: "Backend Engineer", team: "Platform", openedDaysAgo: 12, threshold: 70, agent: "June", contentKey: "be" },
  { name: "Product Designer", team: "Design", openedDaysAgo: 5, threshold: 70, agent: "June", contentKey: "pd" },
  { name: "Account Executive", team: "Sales", openedDaysAgo: 19, threshold: 65, agent: "Adrian", contentKey: "ae" },
];
const DIST: Record<Stage, number> = { applied: 6, application: 5, socials: 4, call: 3, scored: 9 };

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    if ((await ctx.db.query("roles").first()) !== null) return "already seeded";
    const now = Date.now();
    let seed = 1234;
    for (const r of ROLES) {
      const roleId = await ctx.db.insert("roles", {
        slug: r.contentKey, name: r.name, team: r.team, openedAt: now - r.openedDaysAgo * 86_400_000,
        threshold: r.threshold, agent: r.agent, contentKey: r.contentKey, paused: false,
      });
      const rand = rng(seed); seed += 97;
      const names = NAMES.slice().sort(() => rand() - .5);
      let i = 0;
      for (const st of STAGES) {
        for (let k = 0; k < DIST[st]; k++) {
          const c = makeCandidate(r.contentKey, names[i++], rand, st, now, k);
          const id = await ctx.db.insert("candidates", { ...c, roleId });
          const sIdx = STAGES.indexOf(st);
          const ev = (text: string, minsAfterApply: number) =>
            ctx.db.insert("events", { candidateId: id, text, at: c.appliedAt + minsAfterApply * 60_000, byRecruiter: false });
          await ev(`Applied via ${c.source}`, 0);
          if (sIdx >= 1) await ev("Résumé parsed, 3 roles found", 5);
          if (sIdx >= 2) await ev(`Application scored <b>${c.app}</b>`, 12);
          if (sIdx >= 3) { await ev(`Socials checked, ${c.socialsFound.filter(Boolean).length} of 3 found`, 25); await ev(`Text sent: "${r.agent} from Callscreen will call tomorrow at 14:00"`, 30); }
          if (sIdx >= 4 || c.live) { await ev("Call attempt 1, no answer, voicemail left", 48); await ev(c.live ? "Call connected, in progress" : `Call connected, ${Math.floor(c.callDur / 60)}:${String(c.callDur % 60).padStart(2, "0")}`, 50); }
          if (sIdx >= 4) { await ev(`Scored <b>${c.final}</b>${c.final < r.threshold ? ", below the bar" : ", above the bar"}`, 56); if (c.final >= r.threshold) await ev(`Summary sent to #hiring-${r.team.toLowerCase()}`, 56); }
        }
      }
    }
    return "seeded";
  },
});
