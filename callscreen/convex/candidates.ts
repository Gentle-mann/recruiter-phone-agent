import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { STAGES } from "./content";

export const listByRole = query({
  args: { roleId: v.id("roles") },
  handler: async (ctx, { roleId }) =>
    ctx.db.query("candidates").withIndex("by_role", (q) => q.eq("roleId", roleId)).collect(),
});

export const get = query({
  args: { id: v.id("candidates") },
  handler: async (ctx, { id }) => {
    const c = await ctx.db.get(id);
    if (!c) return null;
    const events = await ctx.db.query("events").withIndex("by_candidate", (q) => q.eq("candidateId", id)).collect();
    const notes = await ctx.db.query("notes").withIndex("by_candidate", (q) => q.eq("candidateId", id)).collect();
    const resumeUrl = c.resumeId ? await ctx.storage.getUrl(c.resumeId) : null;
    return { ...c, events: events.sort((a, b) => b.at - a.at), notes, resumeUrl };
  },
});

export const advance = mutation({
  args: { id: v.id("candidates") },
  handler: async (ctx, { id }) => {
    const c = await ctx.db.get(id);
    if (!c) return;
    const i = STAGES.indexOf(c.stage);
    if (i >= STAGES.length - 1) return;
    await ctx.db.patch(id, { stage: STAGES[i + 1], live: false });
    await ctx.db.insert("events", { candidateId: id, text: `<b>You</b> moved ${c.name.split(" ")[0]} to ${STAGES[i + 1]}`, at: Date.now(), byRecruiter: true });
  },
});

export const reject = mutation({
  args: { id: v.id("candidates") },
  handler: async (ctx, { id }) => {
    for (const e of await ctx.db.query("events").withIndex("by_candidate", (q) => q.eq("candidateId", id)).collect()) await ctx.db.delete(e._id);
    for (const n of await ctx.db.query("notes").withIndex("by_candidate", (q) => q.eq("candidateId", id)).collect()) await ctx.db.delete(n._id);
    await ctx.db.delete(id);
  },
});

export const setTaken = mutation({
  args: { id: v.id("candidates"), taken: v.boolean() },
  handler: async (ctx, { id, taken }) => {
    const c = await ctx.db.get(id);
    if (!c) return;
    await ctx.db.patch(id, { taken, live: taken ? false : c.live });
    await ctx.db.insert("events", { candidateId: id, text: taken ? "<b>You</b> took over" : "<b>You</b> handed back to the agent", at: Date.now(), byRecruiter: true });
  },
});

export const addNote = mutation({
  args: { id: v.id("candidates"), text: v.string() },
  handler: async (ctx, { id, text }) => {
    if (!text.trim()) return;
    await ctx.db.insert("notes", { candidateId: id, text: text.trim(), at: Date.now() });
  },
});
