import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { BlogHome } from "./components/BlogHome";
import { PostView } from "./components/PostView";
import { CategoryView } from "./components/CategoryView";
import { TagView } from "./components/TagView";
import { AdminPanel } from "./components/AdminPanel";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";

function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold text-gray-900 cursor-pointer">
           ConvexPress
          </Link>
          <nav className="flex gap-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded ${
                location.pathname === "/" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Home
            </Link>
            <Authenticated>
              <Link
                to="/admin"
                className={`px-3 py-2 rounded ${
                  location.pathname === "/admin" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Admin
              </Link>
            </Authenticated>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Authenticated>
            <SignOutButton />
          </Authenticated>
          <Unauthenticated>
            <Link
              to="/admin"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign In
            </Link>
          </Unauthenticated>
        </div>
      </div>
    </header>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BlogHome />} />
      <Route path="/post/:slug" element={<PostView />} />
      <Route path="/category/:slug" element={<CategoryView />} />
      <Route path="/tag/:slug" element={<TagView />} />
      <Route
        path="/admin"
        element={
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
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <AppRoutes />
        </main>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}
