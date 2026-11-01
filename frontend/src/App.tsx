import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { retryQuery } from "./api/retry";
import { routes } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: retryQuery, staleTime: 5_000 } },
});

const router = createBrowserRouter(routes);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
