'use client';

import React, { useState } from 'react';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

// JSON format for old data
const oldLogsJson = `[
  {
    "dateTimeEntries": [
      { "date": "2025-05-26T00:00:00.000Z", "time": "19:00" }
    ],
    "duration": 24,
    "breastOptions": { "left": true, "right": false },
    "unlatchReason": "self",
    "notes": "",
    "pumpNotes": "",
    "createdAt": "2025-05-26T19:00:00.000Z"
  },
  {
    "dateTimeEntries": [
      { "date": "2025-05-26T00:00:00.000Z", "time": "21:25" },
      { "date": "2025-05-26T00:00:00.000Z", "time": "21:53" },
      { "date": "2025-05-26T00:00:00.000Z", "time": "10:15" }
    ],
    "duration": 15,
    "breastOptions": { "left": true, "right": true },
    "unlatchReason": "self",
    "notes": "disturbed by poop, hiccup",
    "pumpNotes": "",
    "createdAt": "2025-05-26T21:25:00.000Z"
  },
  {
    "dateTimeEntries": [
      { "date": "2025-05-27T00:00:00.000Z", "time": "00:47" },
      { "date": "2025-05-27T00:00:00.000Z", "time": "01:02" },
      { "date": "2025-05-27T00:00:00.000Z", "time": "01:03" }
    ],
    "duration": 16,
    "breastOptions": { "left": true, "right": true },
    "unlatchReason": "disturbed self",
    "notes": "few mins for pacifying",
    "pumpNotes": "",
    "createdAt": "2025-05-27T00:47:00.000Z"
  },
  {
    "dateTimeEntries": [
      { "date": "2025-05-27T00:00:00.000Z", "time": "05:13" }
    ],
    "duration": 22,
    "breastOptions": { "left": false, "right": true },
    "unlatchReason": "self",
    "notes": "",
    "pumpNotes": "6:45, 7:51 for 2 mins",
    "createdAt": "2025-05-27T05:13:00.000Z"
  },
  {
    "dateTimeEntries": [
      { "date": "2025-05-27T00:00:00.000Z", "time": "09:13" }
    ],
    "duration": 17,
    "breastOptions": { "left": true, "right": false },
    "unlatchReason": "self",
    "notes": "",
    "pumpNotes": "",
    "createdAt": "2025-05-27T09:13:00.000Z"
  },
  {
    "dateTimeEntries": [
      { "date": "2025-05-27T00:00:00.000Z", "time": "12:18" }
    ],
    "duration": 0,
    "breastOptions": { "left": false, "right": false },
    "unlatchReason": null,
    "notes": "",
    "pumpNotes": "2 min",
    "createdAt": "2025-05-27T12:18:00.000Z"
  },
  {
    "dateTimeEntries": [
      { "date": "2025-05-27T00:00:00.000Z", "time": "12:48" }
    ],
    "duration": 12,
    "breastOptions": { "left": false, "right": true },
    "unlatchReason": "self",
    "notes": "",
    "pumpNotes": "",
    "createdAt": "2025-05-27T12:48:00.000Z"
  }
]`;

export function DeleteAllLogs() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const toast = useToast();

  // Delete all logs from Firestore
  const handleDeleteAllLogs = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      const logsCollection = collection(db, "feedingLogs");
      const snapshot = await getDocs(logsCollection);
      
      let deletedCount = 0;
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
        deletedCount++;
      }
      
      toast.toast({
        title: "All Logs Deleted",
        description: `Successfully deleted ${deletedCount} logs.`,
      });
      
      // Show JSON after deletion
      setShowJson(true);
    } catch (error) {
      console.error("Error deleting logs:", error);
      toast.toast({
        title: "Error Deleting Logs",
        description: "There was an error deleting the logs.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-center my-4 gap-4">
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleDeleteAllLogs} 
        disabled={isDeleting}
        className="flex items-center gap-2"
      >
        {isDeleting ? (
          <>Deleting...</>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            <span>Delete All Logs</span>
          </>
        )}
      </Button>
      
      {showJson && (
        <div className="w-full mt-4">
          <h3 className="text-lg font-semibold mb-2">JSON Format for Your Old Data:</h3>
          <div className="bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
            <pre className="text-xs">{oldLogsJson}</pre>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Copy this JSON to use with the Firestore import feature or to manually add your logs.
          </p>
        </div>
      )}
    </div>
  );
}
