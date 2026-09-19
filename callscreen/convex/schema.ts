import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const stage = v.union(
  v.literal("applied"),
  v.literal("application"),
  v.literal("socials"),
  v.literal("call"),
  v.literal("scored"),
);

export default defineSchema({
  roles: defineTable({
    slug: v.string(),
    name: v.string(),
    team: v.string(),
    openedAt: v.number(),
    threshold: v.number(),
    agent: v.string(),
    contentKey: v.string(), // which copy pack to use: be | pd | ae
    paused: v.boolean(),
  }).index("by_slug", ["slug"]),

  candidates: defineTable({
    roleId: v.id("roles"),
    name: v.string(),
    loc: v.string(),
    source: v.string(),
    appliedAt: v.number(),
    stage,
    app: v.number(),
    soc: v.number(),
    call: v.number(),
    final: v.number(),
    live: v.boolean(),
    callStartedAt: v.optional(v.number()),
    callDur: v.number(),
    yrs: v.number(),
    company: v.string(),
    area: v.string(),
    stack: v.string(),
    repos: v.number(),
    stars: v.number(),
    socialsFound: v.array(v.boolean()),
    noteIdx: v.number(),
    taken: v.boolean(),
    // Filled in when the candidate applied through the public form.
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    website: v.optional(v.string()),
    resumeId: v.optional(v.id("_storage")),
    authorized: v.optional(v.boolean()),
    startDate: v.optional(v.string()),
    note: v.optional(v.string()),
  })
    .index("by_role", ["roleId"])
    .index("by_role_stage", ["roleId", "stage"]),

  events: defineTable({
    candidateId: v.id("candidates"),
    text: v.string(),
    at: v.number(),
    byRecruiter: v.boolean(),
  }).index("by_candidate", ["candidateId"]),

  notes: defineTable({
    candidateId: v.id("candidates"),
    text: v.string(),
    at: v.number(),
  }).index("by_candidate", ["candidateId"]),
});
