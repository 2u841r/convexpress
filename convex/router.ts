import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Posts endpoints
http.route({
  path: "/posts",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const params = url.searchParams;
    
    const per_page = parseInt(params.get("per_page") || "10");
    const search = params.get("search") || undefined;
    const include = params.get("include")?.split(",").filter(Boolean) as any || undefined;
    const exclude = params.get("exclude")?.split(",").filter(Boolean) as any || undefined;
    const order = (params.get("order") as "asc" | "desc") || "desc";
    const slug = params.get("slug")?.split(",").filter(Boolean) || undefined;
    const categories = params.get("categories")?.split(",").filter(Boolean) as any || undefined;
    const categories_exclude = params.get("categories_exclude")?.split(",").filter(Boolean) as any || undefined;
    const tags = params.get("tags")?.split(",").filter(Boolean) as any || undefined;
    const tags_exclude = params.get("tags_exclude")?.split(",").filter(Boolean) as any || undefined;
    const status = (params.get("status") as "draft" | "published") || undefined;

    const result = await ctx.runQuery(api.posts.list, {
      paginationOpts: { numItems: per_page, cursor: null },
      search,
      include,
      exclude,
      order,
      slug,
      categories,
      categories_exclude,
      tags,
      tags_exclude,
      status,
    });

    return new Response(JSON.stringify(result.page), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Categories endpoints
http.route({
  path: "/categories",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const params = url.searchParams;
    
    const per_page = parseInt(params.get("per_page") || "10");
    const include = params.get("include")?.split(",").filter(Boolean) as any || undefined;
    const exclude = params.get("exclude")?.split(",").filter(Boolean) as any || undefined;
    const order = (params.get("order") as "asc" | "desc") || "asc";
    const orderby = (params.get("orderby") as "name" | "count") || "name";
    const hide_empty = params.get("hide_empty") === "true";

    const result = await ctx.runQuery(api.categories.list, {
      paginationOpts: { numItems: per_page, cursor: null },
      include,
      exclude,
      order,
      orderby,
      hide_empty,
    });

    return new Response(JSON.stringify(result.page), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Tags endpoints
http.route({
  path: "/tags",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const params = url.searchParams;
    
    const per_page = parseInt(params.get("per_page") || "10");
    const include = params.get("include")?.split(",").filter(Boolean) as any || undefined;
    const exclude = params.get("exclude")?.split(",").filter(Boolean) as any || undefined;
    const order = (params.get("order") as "asc" | "desc") || "asc";
    const orderby = (params.get("orderby") as "name" | "count") || "name";
    const hide_empty = params.get("hide_empty") === "true";

    const result = await ctx.runQuery(api.tags.list, {
      paginationOpts: { numItems: per_page, cursor: null },
      include,
      exclude,
      order,
      orderby,
      hide_empty,
    });

    return new Response(JSON.stringify(result.page), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
