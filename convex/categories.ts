import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    include: v.optional(v.array(v.id("categories"))),
    exclude: v.optional(v.array(v.id("categories"))),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    orderby: v.optional(v.union(v.literal("name"), v.literal("count"))),
    hide_empty: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const order = args.order || "asc";
    const categories = await ctx.db.query("categories").order(order).paginate(args.paginationOpts);

    let categoriesWithCount = await Promise.all(
      categories.page.map(async (category) => {
        const postCount = await ctx.db
          .query("posts")
          .withIndex("by_status", (q) => q.eq("status", "published"))
          .collect()
          .then(posts => 
            posts.filter(post => post.categories.includes(category._id)).length
          );

        return {
          ...category,
          count: postCount,
        };
      })
    );

    // Apply filters
    if (args.include) {
      categoriesWithCount = categoriesWithCount.filter(cat => 
        args.include!.includes(cat._id)
      );
    }

    if (args.exclude) {
      categoriesWithCount = categoriesWithCount.filter(cat => 
        !args.exclude!.includes(cat._id)
      );
    }

    if (args.hide_empty) {
      categoriesWithCount = categoriesWithCount.filter(cat => cat.count > 0);
    }

    // Apply ordering
    if (args.orderby === "count") {
      categoriesWithCount.sort((a, b) => 
        order === "asc" ? a.count - b.count : b.count - a.count
      );
    }

    return {
      ...categories,
      page: categoriesWithCount,
    };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // Use first() instead of unique() to handle duplicate slugs gracefully
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .order("desc") // Get the most recent one if duplicates exist
      .first();
    
    if (!category) return null;

    const postCount = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect()
      .then(posts => 
        posts.filter(post => post.categories.includes(category._id)).length
      );

    return {
      ...category,
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
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existing) {
      throw new Error(`A category with the slug "${args.slug}" already exists. Please use a different slug.`);
    }
    
    return await ctx.db.insert("categories", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Check if slug is being updated and if it already exists (excluding current category)
    if (updates.slug) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug!))
        .first();
      
      if (existing && existing._id !== id) {
        throw new Error(`A category with the slug "${updates.slug}" already exists. Please use a different slug.`);
      }
    }
    
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
