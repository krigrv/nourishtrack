import { z } from "zod";

// Define and export unlatchReasons array
export const unlatchReasons = ["self", "mother", "disturbance", "other"] as const;

// Define and export breastOptions array
export const breastOptions = ["left", "right"] as const;

// Create and export DateTimeEntrySchema
export const DateTimeEntrySchema = z.object({
  date: z.date(),
  time: z.string().min(1).regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});

// Create and export FeedingLogSchema
export const FeedingLogSchema = z.object({
  dateTimeEntries: z.array(DateTimeEntrySchema).min(1),
  duration: z.coerce.number().min(1).max(240),
  breast: z.enum(breastOptions),
  unlatchReason: z.enum(unlatchReasons).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  pumpNotes: z.string().max(500).optional().nullable(),
});

// Export corresponding TypeScript types
export type DateTimeEntryData = z.infer<typeof DateTimeEntrySchema>;
export type FeedingLogData = z.infer<typeof FeedingLogSchema>;
