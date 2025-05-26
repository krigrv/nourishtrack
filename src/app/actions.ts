"use server";

import { FeedingLogData, FeedingLogSchema } from "@/lib/types";
import { ZodError } from "zod";

/**
 * Flattens Zod validation errors into a simple object
 */
const flattenErrors = (errors: ZodError) => {
  const flatErrors: Record<string, string> = {};
  
  errors.errors.forEach((error) => {
    const path = error.path.join(".");
    flatErrors[path] = error.message;
  });
  
  return flatErrors;
};

/**
 * Simulates saving data to a Google Sheet
 */
export async function saveToGoogleSheet(data: FeedingLogData) {
  console.log("Attempting to save to Google Sheet:", data);
  // This is a placeholder for actual Google Sheets API integration
  return true;
}

/**
 * Handles submission of feeding log data
 */
export async function submitFeedingLog(data: FeedingLogData) {
  try {
    // Validate data against schema
    const validatedData = FeedingLogSchema.parse(data);
    
    console.log("Validated feeding log data:", validatedData);
    
    // Save to Google Sheet (placeholder)
    await saveToGoogleSheet(validatedData);
    
    return { 
      success: true, 
      message: "Feeding log submitted successfully! (Google Sheet save attempted)" 
    };
  } catch (error) {
    console.error("Error submitting feeding log:", error);
    
    if (error instanceof ZodError) {
      const flatErrorObject = flattenErrors(error);
      return { 
        success: false, 
        message: "Validation failed. Please check your inputs.", 
        errors: flatErrorObject 
      };
    }
    
    return { 
      success: false, 
      message: "An unexpected error occurred. Please try again." 
    };
  }
}
