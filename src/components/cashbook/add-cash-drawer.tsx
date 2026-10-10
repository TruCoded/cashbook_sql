"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { SegmentedControl } from "@/components/ui/tabs";
import { createTransactionSchema, type CreateTransactionFormInput } from "@/validations/transaction";
import { apiFetch } from "@/lib/api-client";

const CATEGORIES_IN = ["Sales", "Loan Received", "Investment", "Refund", "Other"];
const CATEGORIES_OUT = ["Inventory", "Utilities", "Payroll", "Rent", "Supplies", "Other"];

export function AddCashDrawer({
  cashbookId,
  open,
  onClose,
  onSuccess,
  disabled,
}: {
  cashbookId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  disabled?: boolean;
}) {
  const [type, setType] = useState<"CASH_IN" | "CASH_OUT">("CASH_IN");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTransactionFormInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: { type: "CASH_IN" },
  });

  const categories = type === "CASH_IN" ? CATEGORIES_IN : CATEGORIES_OUT;

  const onSubmit = async (data: CreateTransactionFormInput) => {
    setSubmitting(true);
    try {
      const res = await apiFetch<{ emailed?: number; emailFailed?: number }>(`/api/cashbooks/${cashbookId}/transactions`, {
        method: "POST",
        body: JSON.stringify({ ...data, type, clientRequestId: nanoid() }),
      });
      const label = type === "CASH_IN" ? "Cash in recorded" : "Cash out recorded";
      if (res.emailFailed) toast.warning(`${label} — but a PDF email could not be sent to ${res.emailFailed} person(s)`);
      else toast.success(res.emailed ? `${label} — PDF copy emailed to ${res.emailed}` : label);
      reset();
      onClose();
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save transaction");
    } finally {
      setSubmitting(false);
    }
  };

  if (disabled) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Add Cash" description="Everyone on this cashbook sees it, and gets a PDF copy by email.">
      <div className="mb-5 flex justify-center">
        <SegmentedControl
          options={[
            { value: "CASH_IN" as const, label: "Cash In" },
            { value: "CASH_OUT" as const, label: "Cash Out" },
          ]}
          value={type}
          onChange={setType}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <MoneyInput
                id="amount"
                autoFocus
                placeholder="5,000"
                className="mt-1.5 text-lg"
                value={String(field.value ?? "")}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError>{errors.amount?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="person">{type === "CASH_IN" ? "From" : "To"}</Label>
          <Input id="person" placeholder={type === "CASH_IN" ? "Rahul" : "Supplier"} className="mt-1.5" {...register("person")} />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input id="description" placeholder="Payment for order" className="mt-1.5" {...register("description")} />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <select id="category" className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm" {...register("category")}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={2} placeholder="Optional notes" className="mt-1.5" {...register("notes")} />
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="mt-2 w-full">
          {submitting ? "Saving…" : type === "CASH_IN" ? "Add Cash In" : "Add Cash Out"}
        </Button>
      </form>
    </Drawer>
  );
}
