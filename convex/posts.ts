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
    monthYear: v.optional(v.string()), // Format: "YYYY-MM" e.g. "2024-10"
  },
  handler: async (ctx, args) => {
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

    // Filter by month/year if provided (format: "YYYY-MM")
    if (args.monthYear) {
      const [year, month] = args.monthYear.split("-").map(Number);
      posts = posts.filter(post => {
        const postDate = post.publishedDate ? new Date(post.publishedDate) : new Date(post._creationTime);
        const postMonth = postDate.getMonth() + 1; // getMonth() returns 0-11
        const postYear = postDate.getFullYear();
        return postMonth === month && postYear === year;
      });
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
    // Use first() instead of unique() to handle duplicate slugs gracefully
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .order("desc") // Get the most recent one if duplicates exist
      .first();
    
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
    // Check if slug already exists
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existing) {
      throw new Error(`A post with the slug "${args.slug}" already exists. Please use a different slug.`);
    }
    
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
    publishedDate: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Check if slug is being updated and if it already exists (excluding current post)
    if (updates.slug) {
      const existing = await ctx.db
        .query("posts")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug!))
        .first();
      
      if (existing && existing._id !== id) {
        throw new Error(`A post with the slug "${updates.slug}" already exists. Please use a different slug.`);
      }
    }
    
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
