import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, Link } from "react-router-dom";

export function TagView() {
  const { slug } = useParams<{ slug: string }>();

  const tag = useQuery(
    api.tags.getBySlug,
    slug ? { slug } : "skip"
  );

  const posts = useQuery(
    api.posts.list,
    tag
      ? {
          paginationOpts: { numItems: 50, cursor: null },
          tags: [tag._id],
          status: "published",
        }
      : "skip"
  );

  if (tag === undefined || posts === undefined) {
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

  if (tag === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tag Not Found</h1>
          <p className="text-gray-600 mb-8">
            The tag you're looking for doesn't exist.
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          #{tag.name}
        </h1>
        {tag.description && (
          <p className="text-gray-600 text-lg">{tag.description}</p>
        )}
        <p className="text-gray-500 mt-2">
          {tag.count} {tag.count === 1 ? "post" : "posts"}
        </p>
      </div>

      <div className="space-y-8">
        {posts.page.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts found with this tag.</p>
          </div>
        ) : (
          posts.page.map(
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
          )
        )}
      </div>
    </div>
  );
}

