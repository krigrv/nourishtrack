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
 * Placeholder for server-side validation
 * Actual storage will be handled on the client
 */
export async function validateFeedingLog(data: FeedingLogData) {
  try {
    // Just validate the data
    return { success: true };
  } catch (error) {
    console.error("Error validating document: ", error);
    return { success: false, error };
  }
}

/**
 * Handles submission of feeding log data
 */
export async function submitFeedingLog(data: FeedingLogData) {
  try {
    // Validate data against schema
    const validatedData = FeedingLogSchema.parse(data);
    
    console.log("Validated feeding log data:", validatedData);
    
    // Just return success with the validated data
    // Actual storage will be handled on the client side
    return { 
      success: true, 
      message: "Feeding log validated successfully!", 
      data: validatedData
    };
  } catch (error) {
    console.error("Error validating feeding log:", error);
    
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
