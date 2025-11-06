import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function BlogHome() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  // Query for filtered posts (for display)
  const posts = useQuery(api.posts.list, {
    paginationOpts: { numItems: 50, cursor: null },
    search: searchTerm || undefined,
    status: "published",
    monthYear: selectedMonth || undefined,
  });

  // Query for ALL posts (for generating month list)
  const allPosts = useQuery(api.posts.list, {
    paginationOpts: { numItems: 1000, cursor: null },
    status: "published",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setSearchTerm(searchInput);
    }
  };

  const categories = useQuery(api.categories.list, {
    paginationOpts: { numItems: 50, cursor: null },
    hide_empty: true,
  });

  const tags = useQuery(api.tags.list, {
    paginationOpts: { numItems: 50, cursor: null },
    hide_empty: true,
  });

  if (!posts || !allPosts || !categories || !tags) {
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
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search posts... (Press Enter to search)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </form>

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
                    onClick={() => {
                      void navigate(`/post/${post.slug}`);
                    }}
                  >
                    {post.title}
                  </h2>
                  <div className="text-gray-600 mb-4">
                    <time>
                      {new Date(post.publishedDate || post._creationTime).toLocaleDateString('en-US', {
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
                    onClick={() => {
                      void navigate(`/post/${post.slug}`);
                    }}
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
                    onClick={() => {
                      void navigate(`/category/${category.slug}`);
                    }}
                    className="text-left hover:text-blue-600 text-gray-700"
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
                  onClick={() => {
                    void navigate(`/tag/${tag.slug}`);
                  }}
                  className="px-3 py-1 rounded-full text-sm border bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                >
                  {tag.name} ({tag.count})
                </button>
              ))}
            </div>
          </div>

          {/* Archives by Month */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Archives</h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Posts</option>
              {(() => {
                // Generate list of months from ALL posts (not filtered)
                const monthSet = new Set<string>();
                allPosts.page.forEach((post) => {
                  if (post) {
                    const postDate = new Date(post.publishedDate || post._creationTime);
                    const year = postDate.getFullYear();
                    const month = String(postDate.getMonth() + 1).padStart(2, "0");
                    monthSet.add(`${year}-${month}`);
                  }
                });
                
                // Sort months descending (newest first)
                const sortedMonths = Array.from(monthSet).sort().reverse();
                
                return sortedMonths.map((monthYear) => {
                  const [year, month] = monthYear.split("-");
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  return (
                    <option key={monthYear} value={monthYear}>
                      {monthName}
                    </option>
                  );
                });
              })()}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
