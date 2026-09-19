import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    const out = [];
    for (const r of roles) {
      const cands = await ctx.db.query("candidates").withIndex("by_role", (q) => q.eq("roleId", r._id)).collect();
      out.push({ ...r, inProgress: cands.filter((c) => c.stage !== "scored").length, total: cands.length });
    }
    return out;
  },
});

export const create = mutation({
  args: { name: v.string(), team: v.string(), threshold: v.number(), agent: v.string(), contentKey: v.string() },
  handler: async (ctx, a) => {
    const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
    return await ctx.db.insert("roles", { ...a, slug, openedAt: Date.now(), paused: false });
  },
});

export const setPaused = mutation({
  args: { roleId: v.id("roles"), paused: v.boolean() },
  handler: async (ctx, { roleId, paused }) => { await ctx.db.patch(roleId, { paused }); },
});
