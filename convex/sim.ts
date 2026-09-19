// Demo simulation. The client calls `tick` while a board is open; it either
// adds an applicant or advances someone one stage. Stops when nobody is looking.
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { makeCandidate, NAMES, STAGES } from "./content";

export const tick = mutation({
  args: { roleId: v.id("roles"), add: v.boolean() },
  handler: async (ctx, { roleId, add }) => {
    const role = await ctx.db.get(roleId);
    if (!role || role.paused) return;
    const list = await ctx.db.query("candidates").withIndex("by_role", (q) => q.eq("roleId", roleId)).collect();
    const now = Date.now();

    if (add) {
      const used = new Set(list.map((c) => c.name));
      const name = NAMES.find((n) => !used.has(n));
      if (!name) return;
      let s = (now % 100000) + 1;
      const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
      const c = makeCandidate(role.contentKey, name, r, "applied", now, 0);
      c.appliedAt = now;
      const id = await ctx.db.insert("candidates", { ...c, roleId });
      await ctx.db.insert("events", { candidateId: id, text: `Applied via ${c.source}`, at: now, byRecruiter: false });
      return;
    }

    const pool = list.filter((c) => c.stage !== "scored" && !c.taken && !(c.stage === "call" && !c.live && Math.random() < .6));
    if (!pool.length) return;
    const c = pool[Math.floor(Math.random() * pool.length)];
    const i = STAGES.indexOf(c.stage);
    const next = STAGES[i + 1];
    const patch: Record<string, unknown> = { stage: next };
    let text = "";
    if (next === "application") text = `Résumé parsed, 3 roles found`;
    if (next === "socials") text = `Application scored <b>${c.app}</b>`;
    if (next === "call") {
      const live = Math.random() < .5;
      patch.live = live; patch.callStartedAt = live ? now : undefined;
      text = `Socials checked, ${c.socialsFound.filter(Boolean).length} of 3 found`;
    }
    if (next === "scored") {
      patch.live = false;
      patch.callDur = c.callStartedAt ? Math.max(90, Math.round((now - c.callStartedAt) / 1000)) : c.callDur;
      text = `Scored <b>${c.final}</b>${c.final < role.threshold ? ", below the bar" : ", above the bar"}`;
    }
    await ctx.db.patch(c._id, patch);
    await ctx.db.insert("events", { candidateId: c._id, text, at: now, byRecruiter: false });
  },
});
