import { z } from "zod";

export const createCashbookSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  currency: z.string().trim().length(3).default("INR"),
  initialBalance: z.coerce.number().min(0).max(999_999_999).default(0),
  // Optional: the cashbook page opens the partner OTP step for this Gmail right after creation.
  partnerEmail: z.string().trim().optional().or(z.literal("")),
});

export const updateCashbookSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
});

export type CreateCashbookInput = z.infer<typeof createCashbookSchema>;
export type CreateCashbookFormInput = z.input<typeof createCashbookSchema>;
