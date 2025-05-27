import { z } from "zod";

// Define and export unlatchReasons array
export const unlatchReasons = ["self", "mother", "disturbance", "other"] as const;

// Define and export breastOptions array
export const breastOptions = ["left", "right", "both"] as const;

// Create and export DateTimeEntrySchema
export const DateTimeEntrySchema = z.object({
  date: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Invalid date string",
    })
  ]),
  time: z.string().min(1).regex(/^(([01]?\d|2[0-3]):([0-5]\d))|((1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM|am|pm))$/, {
    message: "Time must be in HH:MM format (24-hour) or h:mm AM/PM format (12-hour)",
  }),
});

// Create breast options schema to support checkboxes
export const BreastOptionsSchema = z.object({
  left: z.boolean(),
  right: z.boolean(),
}).required();

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
