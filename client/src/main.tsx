import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { auth } from "./lib/firebase";
import "./index.css";

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "http://127.0.0.1:8481/quotes-vitor/us-central1/api/trpc",
      transformer: superjson,
      async headers() {
        const user = auth.currentUser;
        if (!user) {
          return {};
        }
        const token = await user.getIdToken();
        return {
          Authorization: `Bearer ${token}`,
        };
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
