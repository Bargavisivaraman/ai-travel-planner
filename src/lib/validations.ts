import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const tripSchema = z.object({
  title: z.string().min(2, "Title is required").max(120),
  description: z.string().max(2000).optional().nullable(),
  coverImage: z.string().url().optional().or(z.literal("")).nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budget: z.coerce.number().min(0).default(0),
  currency: z.string().min(1).max(8).default("USD"),
  travelers: z.coerce.number().int().min(1).max(50).default(1),
  status: z.enum(["PLANNING", "BOOKED", "COMPLETED"]).default("PLANNING"),
  isPublic: z.boolean().default(false),
});

export const generateSchema = z.object({
  destination: z.string().min(2, "Destination is required").max(120),
  days: z.coerce.number().int().min(1).max(21),
  interests: z.string().max(300).optional().default(""),
  pace: z.enum(["relaxed", "balanced", "packed"]).default("balanced"),
  budgetLevel: z.enum(["budget", "mid", "luxury"]).default("mid"),
});

export type GenerateInput = z.infer<typeof generateSchema>;
