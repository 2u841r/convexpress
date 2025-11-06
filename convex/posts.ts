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
    // Handle search - Note: search doesn't support proper pagination, so we return all results
    // For proper pagination with search, you'd need to implement a different approach
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
      
      const allResults = filteredPosts.filter(Boolean);
      const pageSize = args.paginationOpts.numItems || 10;
      const cursor = args.paginationOpts.cursor ? parseInt(args.paginationOpts.cursor, 10) : 0;
      const startIndex = cursor;
      const page = allResults.slice(startIndex, startIndex + pageSize);
      const isDone = startIndex + pageSize >= allResults.length;
      
      return {
        page,
        isDone,
        continueCursor: isDone ? null : String(startIndex + pageSize),
      };
    }

    // Apply status filter and order
    const order = args.order || "desc";
    
    // Only filter by status if explicitly provided
    const result = args.status
      ? await ctx.db
          .query("posts")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order(order)
          .paginate(args.paginationOpts)
      : await ctx.db
          .query("posts")
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
    publishedDate: v.optional(v.number()),
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

// Random blog post generator for testing
const randomTitles = [
  "The Future of Web Development",
  "Understanding React Hooks",
  "Building Scalable Applications",
  "Introduction to TypeScript",
  "Modern CSS Techniques",
  "Database Design Best Practices",
  "API Development Guide",
  "Cloud Computing Explained",
  "Machine Learning Basics",
  "Cybersecurity Fundamentals",
  "Mobile App Development",
  "DevOps Best Practices",
  "GraphQL vs REST",
  "Microservices Architecture",
  "Containerization with Docker",
  "CI/CD Pipeline Setup",
  "Performance Optimization Tips",
  "User Experience Design",
  "Agile Development Methodologies",
  "Open Source Contributions",
  "Testing Strategies",
  "Code Review Best Practices",
  "Version Control with Git",
  "Serverless Architecture",
  "Blockchain Technology Overview",
  "Data Structures and Algorithms",
  "System Design Principles",
  "Frontend Frameworks Comparison",
  "Backend Development Patterns",
  "Full Stack Development Guide",
];

const randomBodies = [
  "In this comprehensive guide, we'll explore the latest trends and technologies shaping the future of software development. From emerging frameworks to best practices, we'll cover everything you need to know to stay ahead in the industry.",
  "This article delves deep into the concepts and practices that every developer should understand. We'll break down complex topics into digestible pieces, making it easy for beginners and experienced developers alike.",
  "Learn how to build robust, scalable applications that can handle millions of users. We'll discuss architecture patterns, performance optimization, and real-world examples from successful projects.",
  "Discover the tools and techniques used by top companies to deliver high-quality software. From planning to deployment, we'll walk through the entire development lifecycle.",
  "This tutorial provides step-by-step instructions for implementing modern solutions to common development challenges. Follow along and build your skills with hands-on examples.",
  "Explore the fundamental principles that guide effective software development. We'll examine case studies and learn from industry experts about what works and what doesn't.",
  "Get practical tips and tricks that you can apply immediately to your projects. These insights come from years of experience working on production systems.",
  "Understand the theory behind the practice. We'll explain why certain approaches work better than others and how to make informed decisions in your development work.",
  "Join us on a journey through the evolution of technology. From historical context to future predictions, we'll cover the full spectrum of technological advancement.",
  "Master the skills that separate good developers from great ones. We'll focus on both technical abilities and soft skills that contribute to professional success.",
];

function generateSlug(title: string, index: number): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${baseSlug}-${Date.now()}-${index}`;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

function getRandomDate(start: Date, end: Date): number {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).getTime();
}

export const generateRandomPosts = mutation({
  args: {
    count: v.number(),
  },
  returns: v.object({
    created: v.number(),
  }),
  handler: async (ctx, args) => {
    if (args.count <= 0 || args.count > 1000) {
      throw new Error("Count must be between 1 and 1000");
    }

    // Get all existing categories and tags
    const allCategories = await ctx.db.query("categories").collect();
    const allTags = await ctx.db.query("tags").collect();

    if (allCategories.length === 0 || allTags.length === 0) {
      throw new Error("Please create at least one category and one tag before generating random posts.");
    }

    const statuses: ("draft" | "published")[] = ["draft", "published"];
    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;

    let created = 0;

    for (let i = 0; i < args.count; i++) {
      const title = `${getRandomElement(randomTitles)} ${i + 1}`;
      const body = getRandomElement(randomBodies);
      const slug = generateSlug(title, i);
      const status = getRandomElement(statuses);
      
      // Randomly assign 0-3 categories and 0-5 tags
      const numCategories = Math.floor(Math.random() * Math.min(4, allCategories.length));
      const numTags = Math.floor(Math.random() * Math.min(6, allTags.length));
      const categories = getRandomElements(allCategories, numCategories).map(c => c._id);
      const tags = getRandomElements(allTags, numTags).map(t => t._id);

      // Random published date (some in past, some in future)
      const publishedDate = status === "published" 
        ? getRandomDate(new Date(oneYearAgo), new Date(oneYearFromNow))
        : undefined;

      try {
        await ctx.db.insert("posts", {
          title,
          body,
          slug,
          status,
          categories,
          tags,
          publishedDate,
        });
        created++;
      } catch (error) {
        // Skip if slug already exists (shouldn't happen with timestamp, but just in case)
        console.error(`Failed to create post ${i + 1}:`, error);
      }
    }

    return { created };
  },
});
