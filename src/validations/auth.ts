import { z } from "zod";

const gmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email")
  .refine((e) => /@(gmail|googlemail)\.com$/.test(e), "Please use a Gmail address (name@gmail.com)");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const loginPasswordSchema = z.object({
  email: gmail,
  password: z.string().min(1, "Enter your password").max(128),
});

export const requestOtpSchema = z.object({
  email: gmail,
  purpose: z.enum(["login", "signup"]),
  name: z.string().trim().max(80).optional(),
  businessName: z.string().trim().max(120).optional(),
  password: z.string().max(128).optional(),
});

export const verifyOtpSchema = z.object({
  email: gmail,
  purpose: z.enum(["login", "signup"]),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
  token: z.string().min(10, "Request a new code"),
  name: z.string().trim().max(80).optional(),
  businessName: z.string().trim().max(120).optional(),
  password: z.string().max(128).optional(),
});

export const partnerGmailSchema = z.object({
  email: gmail,
  permission: z.enum(["VIEW", "EDIT"]).default("EDIT"),
});

export const partnerVerifySchema = partnerGmailSchema.extend({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
  token: z.string().min(10, "Request a new code"),
});

export type PartnerGmailFormInput = z.input<typeof partnerGmailSchema>;
