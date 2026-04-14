import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./lib/auth";
import { MarketingWorkflowProvider } from "./lib/marketingWorkflow";
import { SalesAssistantBubble } from "./sales-agent/components/SalesAssistantBubble";

export default function App() {
  return (
    <AuthProvider>
      <MarketingWorkflowProvider>
        <RouterProvider router={router} />
        <Toaster />
        <SalesAssistantBubble />
      </MarketingWorkflowProvider>
    </AuthProvider>
  );
}
