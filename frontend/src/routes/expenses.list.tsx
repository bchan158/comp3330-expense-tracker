// /frontend/src/routes/expenses.list.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AddExpenseForm } from "../components/AddExpenseForm";
import { useToast } from "../components/ToastContext";

export type Expense = {
  id: number;
  title: string;
  amount: number;
  fileUrl?: string | null;
};

const API = "/api";

export default function ExpensesListPage() {
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fetch(`${API}/expenses`, {
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
      }
      return (await res.json()) as { expenses: Expense[] };
    },
    staleTime: 5_000,
    retry: 1,
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete expense");
      return id;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ["expenses"] });

      // Snapshot the previous value
      const previous = qc.getQueryData<{ expenses: Expense[] }>(["expenses"]);

      // Optimistically update by removing the expense
      if (previous) {
        qc.setQueryData(["expenses"], {
          expenses: previous.expenses.filter((item) => item.id !== id),
        });
      }

      // Return context with the previous value
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      // Rollback on error
      if (ctx?.previous) {
        qc.setQueryData(["expenses"], ctx.previous);
      }
      // Show error toast
      showToast("Failed to delete expense. Please try again.", "error");
    },
    onSuccess: () => {
      // Show success toast
      showToast("Expense deleted successfully!", "success");
    },
    onSettled: () => {
      // Always refetch after error or success
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  // Loading state with spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-600">
        <svg
          className="h-5 w-5 animate-spin"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        Loading expenses…
      </div>
    );
  }

  // Error state with retry button
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Could not load expenses</p>
          <p className="mt-1 text-sm text-red-600">
            {(error as Error).message}
          </p>
          <button
            className="mt-3 rounded border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 transition"
            onClick={() => refetch()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const items = data?.expenses ?? [];

  return (
    <section className="mx-auto max-w-3xl p-6 space-y-6">
      {/* Add Expense Form */}
      <AddExpenseForm />

      {/* Expenses List */}
      <div className="space-y-4">
        {/* Header with refresh button */}
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Expenses</h2>
          <button
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Refreshing…
              </span>
            ) : (
              "Refresh"
            )}
          </button>
        </header>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No expenses yet
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Start by adding your first expense using the form above.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <Link
                    to="/expenses/$id"
                    params={{ id: String(expense.id) }}
                    className="font-medium text-gray-900 hover:text-blue-600 underline"
                  >
                    {expense.title}
                  </Link>
                  {expense.fileUrl && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      📎 Receipt
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    ${expense.amount.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${expense.title}"?`)) {
                        deleteExpense.mutate(expense.id);
                      }
                    }}
                    disabled={deleteExpense.isPending}
                    className="text-sm text-red-600 underline hover:text-red-800 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteExpense.isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
