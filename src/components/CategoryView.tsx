import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, Link } from "react-router-dom";

export function CategoryView() {
  const { slug } = useParams<{ slug: string }>();

  const category = useQuery(
    api.categories.getBySlug,
    slug ? { slug } : "skip"
  );

  const {
    results: posts,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.posts.list,
    category
      ? {
          categories: [category._id],
          status: "published",
        }
      : "skip",
    { initialNumItems: 10 }
  );

  if (category === undefined || posts === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (category === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Category Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The category you're looking for doesn't exist.
          </p>
          <Link
            to="/"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
          >
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="mb-8 flex items-center text-blue-600 hover:text-blue-800"
      >
        ← Back to Blog
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 text-lg">{category.description}</p>
        )}
        <p className="text-gray-500 mt-2">
          {category.count} {category.count === 1 ? "post" : "posts"}
        </p>
      </div>

      <div className="space-y-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts found in this category.</p>
          </div>
        ) : (
          <>
            {posts.map(
              (post) =>
                post && (
                  <article
                    key={post._id}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <Link to={`/post/${post.slug}`}>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-blue-600">
                        {post.title}
                      </h2>
                    </Link>
                    <div className="text-gray-600 mb-4">
                      <time>
                        {new Date(post._creationTime).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                    <div className="text-gray-700 mb-4 line-clamp-3">
                      {post.body.substring(0, 200)}...
                    </div>
                    <Link
                      to={`/post/${post.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium inline-block"
                    >
                      Read more →
                    </Link>
                  </article>
                )
            )}
            
            {/* Load More Button */}
            {paginationStatus === "CanLoadMore" && (
              <div className="text-center pt-4">
                <button
                  onClick={() => loadMore(10)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Load More Posts
                </button>
              </div>
            )}
            {paginationStatus === "LoadingMore" && (
              <div className="text-center pt-4">
                <p className="text-gray-500">Loading more posts...</p>
              </div>
            )}
            {paginationStatus === "Exhausted" && posts.length > 0 && (
              <div className="text-center pt-4">
                <p className="text-gray-500">No more posts to load.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

