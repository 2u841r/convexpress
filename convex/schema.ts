import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  posts: defineTable({
    title: v.string(),
    body: v.string(),
    slug: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    tags: v.array(v.id("tags")),
    categories: v.array(v.id("categories")),
    publishedDate: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .searchIndex("search_posts", {
      searchField: "title",
      filterFields: ["status"],
    }),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  })
    .index("by_slug", ["slug"]),

  tags: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  })
    .index("by_slug", ["slug"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
