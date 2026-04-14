import { Navigate, Outlet, createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { ConnectStorePage } from "./pages/ConnectStorePage";
import { EcommerceDashboard } from "./pages/EcommerceDashboard";
import { Onboarding } from "./pages/Onboarding";
import { PostGenerator } from "./pages/PostGenerator";
import { PosterAutoGenerator } from "./pages/PosterAutoGenerator";
import { PosterCreator } from "./pages/PosterCreator";
import PosterStudioGenerator from "./pages/PosterStudioGenerator";
import PosterStudioResults from "./pages/PosterStudioResults";
import { PublishReady } from "./pages/PublishReady";
import { Pipeline } from "./pages/Pipeline";
import { Settings } from "./pages/Settings";
import { Layout } from "./components/Layout";
import { AuthPage } from "./pages/Auth";
import { useAuth } from "./lib/auth";

function RequireAuth() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-cyan-300">
        Chargement de la session...
      </div>
    );
  }

  if (!session?.authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: "/login", Component: AuthPage },
  {
    Component: RequireAuth,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "dashboard", Component: Dashboard },
          { path: "connect-store", Component: ConnectStorePage },
          { path: "ecommerce-dashboard", Component: EcommerceDashboard },
          { path: "onboarding", Component: Onboarding },
          { path: "generate", Component: PostGenerator },
          { path: "poster", Component: PosterCreator },
          { path: "poster/auto", Component: PosterAutoGenerator },
          { path: "poster/studio", Component: PosterStudioGenerator },
          { path: "poster/studio/results/:id", Component: PosterStudioResults },
          { path: "publish", Component: PublishReady },
          { path: "pipeline", Component: Pipeline },
          { path: "settings", Component: Settings },
        ],
      },
    ],
  },
]);
