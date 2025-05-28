import { addDoc, collection, getDocs, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

// New logs from the updated table
const newLogs = [
  {
    dateTimeEntries: [{ date: "2025-05-26T00:00:00.000Z", time: "19:00" }],
    duration: 24,
    breastOptions: { left: true, right: false },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    painTime: null,
    createdAt: "2025-05-26T19:00:00.000Z"
  },
  {
    dateTimeEntries: [
      { date: "2025-05-26T00:00:00.000Z", time: "21:25" },
      { date: "2025-05-26T00:00:00.000Z", time: "21:53" },
      { date: "2025-05-26T00:00:00.000Z", time: "10:15" }
    ],
    duration: 15,
    breastOptions: { left: true, right: true },
    unlatchReason: "self",
    notes: "disturbed by poop, hiccup",
    pumpNotes: "",
    painTime: null,
    createdAt: "2025-05-26T21:25:00.000Z"
  },
  {
    dateTimeEntries: [
      { date: "2025-05-27T00:00:00.000Z", time: "00:47" },
      { date: "2025-05-27T00:00:00.000Z", time: "01:02" },
      { date: "2025-05-27T00:00:00.000Z", time: "01:03" }
    ],
    duration: 16,
    breastOptions: { left: true, right: true },
    unlatchReason: "disturbed self",
    notes: "few mins for pacifying",
    pumpNotes: "6:45,7:51 for 2 mins",
    painTime: null,
    createdAt: "2025-05-27T00:47:00.000Z"
  },
  {
    dateTimeEntries: [{ date: "2025-05-27T00:00:00.000Z", time: "05:13" }],
    duration: 22,
    breastOptions: { left: false, right: true },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    painTime: null,
    createdAt: "2025-05-27T05:13:00.000Z"
  },
  {
    dateTimeEntries: [{ date: "2025-05-27T00:00:00.000Z", time: "09:13" }],
    duration: 17,
    breastOptions: { left: true, right: false },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    painTime: null,
    createdAt: "2025-05-27T09:13:00.000Z"
  },
  {
    dateTimeEntries: [{ date: "2025-05-27T00:00:00.000Z", time: "12:18" }],
    duration: null,
    breastOptions: null,
    unlatchReason: null,
    notes: "",
    pumpNotes: "2 min",
    painTime: null,
    createdAt: "2025-05-27T12:18:00.000Z"
  },
  {
    dateTimeEntries: [{ date: "2025-05-27T00:00:00.000Z", time: "12:48" }],
    duration: 12,
    breastOptions: { left: false, right: true },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    painTime: null,
    createdAt: "2025-05-27T12:48:00.000Z"
  },
  {
    dateTimeEntries: [{ date: "2025-05-27T00:00:00.000Z", time: "14:48" }],
    duration: 13,
    breastOptions: { left: false, right: true },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    painTime: null,
    createdAt: "2025-05-27T14:48:00.000Z"
  },
  {
    dateTimeEntries: [
      { date: "2025-05-27T00:00:00.000Z", time: "17:43" },
      { date: "2025-05-27T00:00:00.000Z", time: "17:56" }
    ],
    duration: 18,
    breastOptions: { left: false, right: true },
    unlatchReason: "self, interrupted",
    notes: "",
    pumpNotes: "",
    painTime: null,
    createdAt: "2025-05-27T17:43:00.000Z"
  },
  {
    dateTimeEntries: [{ date: "2025-05-27T00:00:00.000Z", time: "19:00" }],
    duration: 4,
    breastOptions: { left: true, right: false },
    unlatchReason: "self",
    notes: "drowsy",
    pumpNotes: "",
    painTime: "20:00",
    createdAt: "2025-05-27T19:00:00.000Z"
  },
  {
    dateTimeEntries: [{ date: "2025-05-27T00:00:00.000Z", time: "18:48" }],
    duration: 14,
    breastOptions: { left: false, right: true },
    unlatchReason: "self",
    notes: "",
    pumpNotes: "",
    painTime: null,
    createdAt: "2025-05-27T18:48:00.000Z"
  },
  {
    dateTimeEntries: [
      { date: "2025-05-27T00:00:00.000Z", time: "23:05" },
      { date: "2025-05-27T00:00:00.000Z", time: "23:29" }
    ],
    duration: 20,
    breastOptions: { left: true, right: true },
    unlatchReason: "self, disturbed",
    notes: "",
    pumpNotes: "",
    painTime: "20:35",
    createdAt: "2025-05-27T23:05:00.000Z"
  }
];

// Function to check if an entry is a duplicate
const isDuplicate = (entry: DocumentData, existingEntries: DocumentData[]): boolean => {
  return existingEntries.some(existing => {
    // Check if createdAt timestamps match
    return existing.createdAt === entry.createdAt;
  });
};

// Function to add new logs to Firestore
export const addNewLogsToFirestore = async () => {
  try {
    const logsCollection = collection(db, "feedingLogs");
    const querySnapshot = await getDocs(logsCollection);
    const existingEntries = querySnapshot.docs.map((doc) => doc.data());
    
    let addedCount = 0;
    let duplicateCount = 0;
    
    for (const log of newLogs) {
      if (!isDuplicate(log, existingEntries)) {
        await addDoc(logsCollection, {
          ...log,
          createdAt: new Date(log.createdAt)
        });
        addedCount++;
      } else {
        duplicateCount++;
      }
    }
    
    console.log(`Added ${addedCount} new logs to Firestore. Skipped ${duplicateCount} duplicates.`);
    return { 
      success: true, 
      message: `Added ${addedCount} new logs. Skipped ${duplicateCount} duplicates.` 
    };
  } catch (error) {
    console.error("Error adding new logs to Firestore:", error);
    return { 
      success: false, 
      message: "Error adding new logs to Firestore." 
    };
  }
};

// Function to add new logs to local storage
export const addNewLogsToLocalStorage = () => {
  try {
    // Get existing logs from local storage
    const existingLogsStr = localStorage.getItem('feedingLogs');
    const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
    
    let addedCount = 0;
    let duplicateCount = 0;
    
    // Add new logs with unique IDs, skipping duplicates
    const logsToAdd = [];
    
    for (const log of newLogs) {
      if (!isDuplicate(log, existingLogs)) {
        logsToAdd.push({
          ...log,
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
        addedCount++;
      } else {
        duplicateCount++;
      }
    }
    
    // Combine existing and new logs
    const combinedLogs = [...logsToAdd, ...existingLogs];
    
    // Save back to local storage
    localStorage.setItem('feedingLogs', JSON.stringify(combinedLogs));
    
    console.log(`Added ${addedCount} new logs to local storage. Skipped ${duplicateCount} duplicates.`);
    return { 
      success: true, 
      message: `Added ${addedCount} new logs. Skipped ${duplicateCount} duplicates.` 
    };
  } catch (error) {
    console.error("Error adding new logs to local storage:", error);
    return { 
      success: false, 
      message: "Error adding new logs to local storage." 
    };
  }
};
