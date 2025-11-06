import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, Link } from "react-router-dom";

export function PostView() {
  const { slug } = useParams<{ slug: string }>();
  const post = useQuery(
    api.posts.getBySlug,
    slug ? { slug } : "skip"
  );

  if (post === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-8 w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The post you're looking for doesn't exist.</p>
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="mb-8 flex items-center text-blue-600 hover:text-blue-800"
      >
        ← Back to Blog
      </Link>

      <article className="bg-white rounded-lg shadow-sm border p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-4 text-gray-600 mb-6">
            <time>
              {new Date(post.publishedDate || post._creationTime).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
              {post.status}
            </span>
          </div>

          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="mb-4">
              <span className="text-gray-700 font-medium">Categories: </span>
              <div className="inline-flex flex-wrap gap-2">
                {post.categories.map((category) => category && (
                  <Link
                    key={category._id}
                    to={`/category/${category.slug}`}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 cursor-pointer"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-6">
              <span className="text-gray-700 font-medium">Tags: </span>
              <div className="inline-flex flex-wrap gap-2">
                {post.tags.map((tag) => tag && (
                  <Link
                    key={tag._id}
                    to={`/tag/${tag.slug}`}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 cursor-pointer"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </header>

        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {post.body}
          </div>
        </div>
      </article>
    </div>
  );
}
