import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { BlogHome } from "./components/BlogHome";
import { PostView } from "./components/PostView";
import { AdminPanel } from "./components/AdminPanel";
import { useState } from "react";

export default function App() {
  const [currentView, setCurrentView] = useState<"blog" | "post" | "admin">("blog");
  const [currentSlug, setCurrentSlug] = useState<string>("");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer"
              onClick={() => setCurrentView("blog")}
            >
              My WordPress Blog
            </h1>
            <nav className="flex gap-4">
              <button
                onClick={() => setCurrentView("blog")}
                className={`px-3 py-2 rounded ${currentView === "blog" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"}`}
              >
                Home
              </button>
              <Authenticated>
                <button
                  onClick={() => setCurrentView("admin")}
                  className={`px-3 py-2 rounded ${currentView === "admin" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Admin
                </button>
              </Authenticated>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Authenticated>
              <SignOutButton />
            </Authenticated>
            <Unauthenticated>
              <button
                onClick={() => setCurrentView("admin")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sign In
              </button>
            </Unauthenticated>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {currentView === "blog" && (
          <BlogHome 
            onPostClick={(slug) => {
              setCurrentSlug(slug);
              setCurrentView("post");
            }}
          />
        )}
        {currentView === "post" && (
          <PostView 
            slug={currentSlug}
            onBack={() => setCurrentView("blog")}
          />
        )}
        {currentView === "admin" && (
          <div>
            <Authenticated>
              <AdminPanel />
            </Authenticated>
            <Unauthenticated>
              <div className="max-w-md mx-auto mt-16">
                <SignInForm />
              </div>
            </Unauthenticated>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
