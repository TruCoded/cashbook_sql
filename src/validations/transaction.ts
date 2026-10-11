import { z } from "zod";

export const createTransactionSchema = z.object({
  type: z.enum(["CASH_IN", "CASH_OUT"]),
  amount: z.coerce.number().positive("Amount must be greater than zero").max(999_999_999),
  person: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  occurredAt: z.coerce.date().optional(),
  clientRequestId: z.string().trim().max(100).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
// Form-facing type (pre-coercion) — use this for useForm<>() generics.
export type CreateTransactionFormInput = z.input<typeof createTransactionSchema>;
