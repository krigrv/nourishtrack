'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

// User's exact logs
const userLogs = [
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
    "pumpNotes": "",
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
    "unlatchReason": "",
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
  },
  {
    "dateTimeEntries": [
      { "date": "2025-05-27T00:00:00.000Z", "time": "06:45" },
      { "date": "2025-05-27T00:00:00.000Z", "time": "07:51" }
    ],
    "duration": 0,
    "breastOptions": { "left": false, "right": false },
    "unlatchReason": "",
    "notes": "",
    "pumpNotes": "2 mins each",
    "createdAt": "2025-05-27T06:45:00.000Z"
  }
];

export function ImportUserLogs() {
  const [isImporting, setIsImporting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const toast = useToast();

  // Function to clear all logs and import user logs
  const clearAndImportLogs = async () => {
    if (isImporting || isComplete) return;
    
    setIsImporting(true);
    
    try {
      // Step 1: Clear all existing logs
      const logsCollection = collection(db, "feedingLogs");
      const snapshot = await getDocs(logsCollection);
      
      const deletePromises: Promise<void>[] = [];
      snapshot.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      await Promise.all(deletePromises);
      
      // Step 2: Add user logs
      for (const log of userLogs) {
        await addDoc(logsCollection, {
          ...log,
          createdAt: new Date(log.createdAt)
        });
      }
      
      setIsComplete(true);
      
      // No toast notification or page reload
      // Just silently import the data
      console.log('Logs imported successfully');
    } catch (error) {
      console.error("Error importing logs:", error);
      toast.toast({
        title: "Error Importing Logs",
        description: "There was an error importing your logs.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Run only once ever by checking localStorage
  useEffect(() => {
    // Check if we've already imported the logs
    const hasImported = localStorage.getItem('logsImported');
    
    if (!hasImported) {
      // Add a small delay to ensure Firebase is initialized
      const timer = setTimeout(() => {
        clearAndImportLogs();
        // Mark as imported in localStorage
        localStorage.setItem('logsImported', 'true');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return null; // This component doesn't render anything
}
