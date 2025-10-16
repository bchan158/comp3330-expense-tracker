import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "./ToastContext";

type Expense = {
  id: number;
  title: string;
  amount: number;
  fileUrl: string | null;
};

export function AddExpenseForm() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: { title: string; amount: number }) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(message || "Failed to add expense");
      }
      return (await res.json()) as { expense: Expense };
    },
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ["expenses"] });

      // Snapshot the previous value
      const previous = qc.getQueryData<{ expenses: Expense[] }>(["expenses"]);

      // Optimistically update to the new value
      if (previous) {
        const optimistic: Expense = {
          id: Date.now(),
          title: newItem.title,
          amount: newItem.amount,
          fileUrl: null,
        };
        qc.setQueryData(["expenses"], {
          expenses: [...previous.expenses, optimistic],
        });
      }

      // Return context with the previous value
      return { previous };
    },
    onError: (_err, _newItem, ctx) => {
      // Rollback on error
      if (ctx?.previous) {
        qc.setQueryData(["expenses"], ctx.previous);
      }
      // Show error toast
      showToast("Failed to add expense. Please try again.", "error");
    },
    onSuccess: (data) => {
      // Reset form after successful submission
      setTitle("");
      setAmount("");
      setFormError(null);
      // Show success toast
      showToast(`Added "${data.expense.title}" successfully!`, "success");
    },
    onSettled: () => {
      // Always refetch after error or success
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    // Clear mutation error when user retries
    if (mutation.isError) {
      mutation.reset();
    }

    // Validation
    if (!title.trim()) {
      return setFormError("Title is required");
    }

    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
      return setFormError("Amount must be greater than 0");
    }

    mutation.mutate({ title: title.trim(), amount });
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-start gap-2"
      >
        <input
          className="flex-1 min-w-[200px] rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            // Clear errors when user starts typing
            if (formError) setFormError(null);
            if (mutation.isError) mutation.reset();
          }}
          placeholder="Expense title"
          disabled={mutation.isPending}
        />
        <input
          className="w-32 rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value === "" ? "" : Number(e.target.value));
            // Clear errors when user starts typing
            if (formError) setFormError(null);
            if (mutation.isError) mutation.reset();
          }}
          placeholder="Amount"
          disabled={mutation.isPending}
        />
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
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
              Adding…
            </span>
          ) : (
            "Add Expense"
          )}
        </button>

        {/* Inline error messages (still useful for validation errors) */}
        {formError && (
          <p className="w-full text-sm text-red-600 mt-1">{formError}</p>
        )}
      </form>
    </div>
  );
}
