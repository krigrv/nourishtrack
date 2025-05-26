import { z } from "zod";

// Define and export unlatchReasons array
export const unlatchReasons = ["self", "mother", "disturbance", "other"] as const;

// Define and export breastOptions array
export const breastOptions = ["left", "right", "both"] as const;

// Create and export DateTimeEntrySchema
export const DateTimeEntrySchema = z.object({
  date: z.date(),
  time: z.string().min(1).regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});

// Create breast options schema to support checkboxes
export const BreastOptionsSchema = z.object({
  left: z.boolean().default(false),
  right: z.boolean().default(false),
});

// Create and export FeedingLogSchema
export const FeedingLogSchema = z.object({
  dateTimeEntries: z.array(DateTimeEntrySchema).min(1),
  duration: z.coerce.number().min(1).max(240),
  breastOptions: BreastOptionsSchema,
  unlatchReason: z.enum(unlatchReasons).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  pumpNotes: z.string().max(500).optional().nullable(),
});

// Export corresponding TypeScript types
export type DateTimeEntry = z.infer<typeof DateTimeEntrySchema>;
export type BreastOptions = z.infer<typeof BreastOptionsSchema>;
export type FeedingLogData = z.infer<typeof FeedingLogSchema>;
