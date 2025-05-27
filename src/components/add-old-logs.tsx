'use client';

import React, { useEffect, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

// Old logs data from the user
const oldLogs = [
  // 26 May
  {
    dateTimeEntries: [{ date: new Date("2025-05-26").toISOString(), time: "19:00" }],
    duration: 24,
    breastOptions: { left: true, right: false },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    createdAt: new Date("2025-05-26T19:00:00").toISOString(),
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
    createdAt: new Date("2025-05-26T21:25:00").toISOString(),
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
    createdAt: new Date("2025-05-27T00:47:00").toISOString(),
  },
  {
    dateTimeEntries: [{ date: new Date("2025-05-27").toISOString(), time: "05:13" }],
    duration: 22,
    breastOptions: { left: false, right: true },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "6:45, 7:51 for 2 mins",
    createdAt: new Date("2025-05-27T05:13:00").toISOString(),
  },
  {
    dateTimeEntries: [{ date: new Date("2025-05-27").toISOString(), time: "09:13" }],
    duration: 17,
    breastOptions: { left: true, right: false },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    createdAt: new Date("2025-05-27T09:13:00").toISOString(),
  },
  {
    dateTimeEntries: [{ date: new Date("2025-05-27").toISOString(), time: "12:18" }],
    duration: 0,
    breastOptions: { left: false, right: false },
    unlatchReason: null,
    notes: "",
    pumpNotes: "2 min",
    createdAt: new Date("2025-05-27T12:18:00").toISOString(),
  },
  {
    dateTimeEntries: [{ date: new Date("2025-05-27").toISOString(), time: "12:48" }],
    duration: 12,
    breastOptions: { left: false, right: true },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    createdAt: new Date("2025-05-27T12:48:00").toISOString(),
  }
];

export function AddOldLogs() {
  const [isAdding, setIsAdding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const toast = useToast();

  // Add old logs to Firestore
  const addOldLogsToFirestore = async () => {
    if (isAdding || isComplete) return;
    
    setIsAdding(true);
    let successCount = 0;
    
    try {
      const logsCollection = collection(db, "feedingLogs");
      
      for (const log of oldLogs) {
        await addDoc(logsCollection, {
          ...log,
          createdAt: new Date(log.createdAt)
        });
        successCount++;
      }
      
      toast.toast({
        title: "Previous Logs Added",
        description: `Successfully added ${successCount} previous feeding logs.`,
      });
      
      setIsComplete(true);
      
      // Switch to the Past Logs tab to show the imported logs
      setTimeout(() => {
        // Only change the hash if we're not already on the past-logs tab
        if (window.location.hash !== '#past-logs') {
          window.location.hash = 'past-logs';
        }
      }, 500);
    } catch (error) {
      console.error("Error adding old logs to Firestore:", error);
      toast.toast({
        title: "Error Adding Logs",
        description: "There was an error adding your previous logs.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Run once on component mount
  useEffect(() => {
    // Add a small delay to ensure Firebase is initialized
    const timer = setTimeout(() => {
      addOldLogsToFirestore();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
}
