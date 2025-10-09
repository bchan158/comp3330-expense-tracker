import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import App from "./App";
import ExpensesListPage from "./routes/expenses.list";
import ExpenseDetailPage from "./routes/expenses.detail";
import ExpenseNewPage from "./routes/expenses.new";

const rootRoute = createRootRoute({
  component: () => <App />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <p>Home Page</p>,
});

const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses",
  component: ExpensesListPage,
});

const expensesDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses/$id",
  component: () => {
    const { id } = expensesDetailRoute.useParams();
    return <ExpenseDetailPage id={Number(id)} />;
  },
});

const expensesNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses/new",
  component: ExpenseNewPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  expensesRoute,
  expensesNewRoute,
  expensesDetailRoute,
]);

export const router = createRouter({ routeTree });

router.update({
  defaultNotFoundComponent: () => <p>Page not found</p>,
  defaultErrorComponent: ({ error }) => (
    <p>Error: {(error as Error).message}</p>
  ),
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}
