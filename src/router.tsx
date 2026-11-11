import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { SwivvErrorScreen } from "./components/swivv-error-screen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // ponytail: one crash screen for every route — a route only needs its own if it must keep its layout
    defaultErrorComponent: SwivvErrorScreen,
  });

  return router;
};
