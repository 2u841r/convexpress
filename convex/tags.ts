import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    include: v.optional(v.array(v.id("tags"))),
    exclude: v.optional(v.array(v.id("tags"))),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    orderby: v.optional(v.union(v.literal("name"), v.literal("count"))),
    hide_empty: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const order = args.order || "asc";
    let tags = await ctx.db.query("tags").order(order).paginate(args.paginationOpts);

    let tagsWithCount = await Promise.all(
      tags.page.map(async (tag) => {
        const postCount = await ctx.db
          .query("posts")
          .withIndex("by_status", (q) => q.eq("status", "published"))
          .collect()
          .then(posts => 
            posts.filter(post => post.tags.includes(tag._id)).length
          );

        return {
          ...tag,
          count: postCount,
        };
      })
    );

    // Apply filters
    if (args.include) {
      tagsWithCount = tagsWithCount.filter(tag => 
        args.include!.includes(tag._id)
      );
    }

    if (args.exclude) {
      tagsWithCount = tagsWithCount.filter(tag => 
        !args.exclude!.includes(tag._id)
      );
    }

    if (args.hide_empty) {
      tagsWithCount = tagsWithCount.filter(tag => tag.count > 0);
    }

    // Apply ordering
    if (args.orderby === "count") {
      tagsWithCount.sort((a, b) => 
        order === "asc" ? a.count - b.count : b.count - a.count
      );
    }

    return {
      ...tags,
      page: tagsWithCount,
    };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const tag = await ctx.db
      .query("tags")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    
    if (!tag) return null;

    const postCount = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect()
      .then(posts => 
        posts.filter(post => post.tags.includes(tag._id)).length
      );

    return {
      ...tag,
      count: postCount,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("tags"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("tags", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("tags"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("tags") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
