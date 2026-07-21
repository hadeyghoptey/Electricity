import { z } from "zod";

export const readingSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format"),
  previous: z.number().min(0).default(0),
  current: z.number().min(0).default(0),
});

export const extraMeterReadingSchema = z.object({
  meterId: z.string().min(1, "meterId is required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format"),
  previous: z.number().min(0).default(0),
  current: z.number().min(0).default(0),
});

export const roomUpdateSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  name: z.string().optional(),
  meterType: z.enum(["separate", "shared", "unmetered"]).optional(),
});

export const configUpdateSchema = z.object({
  unitPrice: z.number().positive("unitPrice must be positive"),
});
