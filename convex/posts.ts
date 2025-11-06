import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    include: v.optional(v.array(v.id("posts"))),
    exclude: v.optional(v.array(v.id("posts"))),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    slug: v.optional(v.array(v.string())),
    categories: v.optional(v.array(v.id("categories"))),
    categories_exclude: v.optional(v.array(v.id("categories"))),
    tags: v.optional(v.array(v.id("tags"))),
    tags_exclude: v.optional(v.array(v.id("tags"))),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("posts");

    // Handle search
    if (args.search) {
      const searchResults = await ctx.db
        .query("posts")
        .withSearchIndex("search_posts", (q) => 
          q.search("title", args.search!)
            .eq("status", args.status || "published")
        )
        .collect();
      
      const searchIds = searchResults.map(p => p._id);
      const filteredPosts = await Promise.all(
        searchIds.map(id => ctx.db.get(id))
      );
      
      return {
        page: filteredPosts.filter(Boolean).slice(0, args.paginationOpts.numItems || 10),
        isDone: true,
        continueCursor: null,
      };
    }

    // Apply status filter and order
    const status = args.status || "published";
    const order = args.order || "desc";
    
    const result = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order(order)
      .paginate(args.paginationOpts);


    
    let posts = result.page;

    // Apply filters
    if (args.include) {
      posts = posts.filter(post => args.include!.includes(post._id));
    }

    if (args.exclude) {
      posts = posts.filter(post => !args.exclude!.includes(post._id));
    }

    if (args.slug) {
      posts = posts.filter(post => args.slug!.includes(post.slug));
    }

    if (args.categories) {
      posts = posts.filter(post => 
        post.categories.some(catId => args.categories!.includes(catId))
      );
    }

    if (args.categories_exclude) {
      posts = posts.filter(post => 
        !post.categories.some(catId => args.categories_exclude!.includes(catId))
      );
    }

    if (args.tags) {
      posts = posts.filter(post => 
        post.tags.some(tagId => args.tags!.includes(tagId))
      );
    }

    if (args.tags_exclude) {
      posts = posts.filter(post => 
        !post.tags.some(tagId => args.tags_exclude!.includes(tagId))
      );
    }

    return {
      ...result,
      page: posts,
    };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    
    if (!post) return null;

    // Get categories and tags
    const categories = await Promise.all(
      post.categories.map(id => ctx.db.get(id))
    );
    const tags = await Promise.all(
      post.tags.map(id => ctx.db.get(id))
    );

    return {
      ...post,
      categories: categories.filter(Boolean),
      tags: tags.filter(Boolean),
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    slug: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    tags: v.array(v.id("tags")),
    categories: v.array(v.id("categories")),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    tags: v.optional(v.array(v.id("tags"))),
    categories: v.optional(v.array(v.id("categories"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
