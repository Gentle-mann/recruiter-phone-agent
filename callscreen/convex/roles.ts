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
    const base = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "role";
    let slug = base;
    for (let n = 2; await ctx.db.query("roles").withIndex("by_slug", (q) => q.eq("slug", slug)).first(); n++) slug = `${base}-${n}`;
    return await ctx.db.insert("roles", { ...a, slug, openedAt: Date.now(), paused: false });
  },
});

/** Public: what the application page needs to render. */
export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const r = await ctx.db.query("roles").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    return r ? { _id: r._id, name: r.name, team: r.team, agent: r.agent } : null;
  },
});
