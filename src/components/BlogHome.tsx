import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

interface BlogHomeProps {
  onPostClick: (slug: string) => void;
}

export function BlogHome({ onPostClick }: BlogHomeProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  const posts = useQuery(api.posts.list, {
    paginationOpts: { numItems: 10, cursor: null },
    search: searchTerm || undefined,
    status: "published",
  });

  const categories = useQuery(api.categories.list, {
    paginationOpts: { numItems: 50, cursor: null },
    hide_empty: true,
  });

  const tags = useQuery(api.tags.list, {
    paginationOpts: { numItems: 50, cursor: null },
    hide_empty: true,
  });

  if (!posts || !categories || !tags) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Posts */}
          <div className="space-y-8">
            {posts.page.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No posts found.</p>
              </div>
            ) : (
              posts.page.map((post) => post && (
                <article key={post._id} className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 
                    className="text-2xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-blue-600"
                    onClick={() => onPostClick(post.slug)}
                  >
                    {post.title}
                  </h2>
                  <div className="text-gray-600 mb-4">
                    <time>
                      {new Date(post._creationTime).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  <div className="text-gray-700 mb-4 line-clamp-3">
                    {post.body.substring(0, 200)}...
                  </div>
                  <button
                    onClick={() => onPostClick(post.slug)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Read more →
                  </button>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Categories */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.page.map((category) => (
                <div key={category._id} className="flex justify-between items-center">
                  <button
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`text-left hover:text-blue-600 ${
                      selectedCategory === category.slug ? "text-blue-600 font-medium" : "text-gray-700"
                    }`}
                  >
                    {category.name}
                  </button>
                  <span className="text-gray-500 text-sm">({category.count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.page.map((tag) => (
                <button
                  key={tag._id}
                  onClick={() => setSelectedTag(tag.slug)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    selectedTag === tag.slug
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {tag.name} ({tag.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
