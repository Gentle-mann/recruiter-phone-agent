// Public endpoint used by /apply.
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const submit = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    loc: v.string(),
    linkedin: v.optional(v.string()),
    website: v.optional(v.string()),
    resumeId: v.optional(v.id("_storage")),
    authorized: v.boolean(),
    startDate: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const role = await ctx.db.query("roles").withIndex("by_slug", (q) => q.eq("slug", a.slug)).first();
    if (!role) throw new Error("This role is not accepting applications.");
    const name = a.name.trim();
    if (!name || !a.email.trim()) throw new Error("Name and email are required.");
    const now = Date.now();
    const id = await ctx.db.insert("candidates", {
      roleId: role._id, name, loc: a.loc.trim() || "Unknown", source: "Careers page", appliedAt: now,
      stage: "applied", app: 0, soc: 0, call: 0, final: 0, live: false, callDur: 0,
      yrs: 0, company: "", area: "", stack: "", repos: 0, stars: 0,
      socialsFound: [!!a.website, !!a.linkedin, false], noteIdx: 0, taken: false,
      email: a.email.trim(), phone: a.phone.trim(), linkedin: a.linkedin?.trim() || undefined, website: a.website?.trim() || undefined,
      resumeId: a.resumeId, authorized: a.authorized, startDate: a.startDate.trim(), note: a.note?.trim() || undefined,
    });
    await ctx.db.insert("events", { candidateId: id, text: "Applied via the careers page", at: now, byRecruiter: false });
    return id;
  },
});
