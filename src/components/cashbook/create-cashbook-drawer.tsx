"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { createCashbookSchema, type CreateCashbookFormInput } from "@/validations/cashbook";
import { apiFetch } from "@/lib/api-client";
import type { Cashbook } from "@/types";

const CATEGORIES = ["Personal", "Shop", "Business", "Project", "Other"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

export function CreateCashbookDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCashbookFormInput>({
    resolver: zodResolver(createCashbookSchema),
    defaultValues: { currency: "INR", initialBalance: 0 },
  });

  const onSubmit = async (data: CreateCashbookFormInput) => {
    setSubmitting(true);
    try {
      const { cashbook } = await apiFetch<{ cashbook: Cashbook }>("/api/cashbooks", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await mutate("/api/cashbooks");
      toast.success(`"${cashbook.name}" is ready`);
      reset();
      onClose();
      const partner = (data.partnerEmail ?? "").trim();
      router.push(`/cashbooks/${cashbook.id}${partner ? `?partner=${encodeURIComponent(partner)}` : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create cashbook");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Create Cashbook" description="Start tracking a new pool of cash.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Cashbook name</Label>
          <Input id="name" placeholder="Sharma General Store" className="mt-1.5" {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={2} placeholder="Daily shop cash" className="mt-1.5" {...register("description")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
              {...register("category")}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
              {...register("currency")}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="initialBalance">Initial balance</Label>
          <Controller
            control={control}
            name="initialBalance"
            render={({ field }) => (
              <MoneyInput
                id="initialBalance"
                placeholder="50,000"
                className="mt-1.5"
                value={String(field.value ?? "")}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError>{errors.initialBalance?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="partnerEmail">Partner&apos;s Gmail (optional)</Label>
          <Input id="partnerEmail" type="email" placeholder="partner@gmail.com" className="mt-1.5" {...register("partnerEmail")} />
          <p className="text-xs text-muted mt-1">We&apos;ll email them a code so you can confirm them as a partner.</p>
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="mt-2 w-full">
          {submitting ? "Creating…" : "Create Cashbook"}
        </Button>
      </form>
    </Drawer>
  );
}
