"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { addNewLogsToFirestore, addNewLogsToLocalStorage } from "./add-new-logs";

export function ImportNewLogs() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{success: boolean, message: string} | null>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      // Try to add to Firestore first
      let result;
      try {
        result = await addNewLogsToFirestore();
        console.log("Firestore new logs result:", result);
      } catch (error) {
        console.error("Error adding new logs to Firestore:", error);
        // Fall back to localStorage if Firestore fails
        result = addNewLogsToLocalStorage();
        console.log("Local storage new logs result:", result);
      }
      
      setStatus(result);
      
      // Show success toast
      toast({
        title: "New logs imported",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error importing new logs:", error);
      setStatus({
        success: false,
        message: "Failed to import new logs. See console for details."
      });
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to import new logs. See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-center"
        onClick={handleImport}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            Importing...
          </>
        ) : (
          <>
            <Database className="h-4 w-4 mr-2" />
            Import New Logs
          </>
        )}
      </Button>
      {status && (
        <p className={`text-xs mt-1 ${status.success ? 'text-green-600' : 'text-red-600'}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}
