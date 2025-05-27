'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Trash2, Database } from 'lucide-react';

// User's feeding logs data
const feedingLogs = [
  // 26 May
  {
    dateTimeEntries: [{ date: new Date("2025-05-26").toISOString(), time: "19:00" }],
    duration: 24,
    breastOptions: { left: true, right: false },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    createdAt: new Date("2025-05-26T19:00:00")
  },
  {
    dateTimeEntries: [
      { date: new Date("2025-05-26").toISOString(), time: "21:25" },
      { date: new Date("2025-05-26").toISOString(), time: "21:53" },
      { date: new Date("2025-05-26").toISOString(), time: "10:15" }
    ],
    duration: 15, // Combined 8+5+2
    breastOptions: { left: true, right: true },
    unlatchReason: "self",
    notes: "disturbed by poop, hiccup",
    pumpNotes: "",
    createdAt: new Date("2025-05-26T21:25:00")
  },
  
  // 27 May
  {
    dateTimeEntries: [
      { date: new Date("2025-05-27").toISOString(), time: "00:47" },
      { date: new Date("2025-05-27").toISOString(), time: "01:02" },
      { date: new Date("2025-05-27").toISOString(), time: "01:03" }
    ],
    duration: 16, // Combined 13+2+1
    breastOptions: { left: true, right: true },
    unlatchReason: "disturbed self",
    notes: "few mins for pacifying",
    pumpNotes: "",
    createdAt: new Date("2025-05-27T00:47:00")
  },
  {
    dateTimeEntries: [{ date: new Date("2025-05-27").toISOString(), time: "05:13" }],
    duration: 22,
    breastOptions: { left: false, right: true },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "6:45, 7:51 for 2 mins",
    createdAt: new Date("2025-05-27T05:13:00")
  },
  {
    dateTimeEntries: [{ date: new Date("2025-05-27").toISOString(), time: "09:13" }],
    duration: 17,
    breastOptions: { left: true, right: false },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    createdAt: new Date("2025-05-27T09:13:00")
  },
  {
    dateTimeEntries: [{ date: new Date("2025-05-27").toISOString(), time: "12:18" }],
    duration: 0,
    breastOptions: { left: false, right: false },
    unlatchReason: null,
    notes: "",
    pumpNotes: "2 min",
    createdAt: new Date("2025-05-27T12:18:00")
  },
  {
    dateTimeEntries: [{ date: new Date("2025-05-27").toISOString(), time: "12:48" }],
    duration: 12,
    breastOptions: { left: false, right: true },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    createdAt: new Date("2025-05-27T12:48:00")
  }
];

export function ClearAndAddLogs() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const toast = useToast();

  // Clear all existing logs and add new ones
  const clearAndAddLogs = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Step 1: Clear all existing logs
      const logsCollection = collection(db, "feedingLogs");
      const snapshot = await getDocs(logsCollection);
      
      let deletedCount = 0;
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
        deletedCount++;
      }
      
      // Step 2: Add new logs
      let addedCount = 0;
      for (const log of feedingLogs) {
        await addDoc(logsCollection, log);
        addedCount++;
      }
      
      toast.toast({
        title: "Data Reset Complete",
        description: `Deleted ${deletedCount} old logs and added ${addedCount} new logs.`,
      });
      
      setIsComplete(true);
      
      // Refresh the page to show the new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error processing logs:", error);
      toast.toast({
        title: "Error Processing Logs",
        description: "There was an error clearing and adding logs.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex justify-center my-4">
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={clearAndAddLogs} 
        disabled={isProcessing || isComplete}
        className="flex items-center gap-2"
      >
        {isProcessing ? (
          <>Processing...</>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            <span>Clear & Add Specific Logs</span>
          </>
        )}
      </Button>
    </div>
  );
}
