import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Sample logs from the user input
const sampleLogs = [
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

// Function to add sample logs to Firestore
export const addSampleLogsToFirestore = async () => {
  try {
    const logsCollection = collection(db, "feedingLogs");
    
    for (const log of sampleLogs) {
      await addDoc(logsCollection, {
        ...log,
        createdAt: new Date(log.createdAt)
      });
    }
    
    console.log("Sample logs added to Firestore successfully!");
    return { success: true, message: "Sample logs added successfully!" };
  } catch (error) {
    console.error("Error adding sample logs to Firestore:", error);
    return { success: false, message: "Error adding sample logs." };
  }
};

// Function to add sample logs to local storage
export const addSampleLogsToLocalStorage = () => {
  try {
    // Get existing logs from local storage
    const existingLogsStr = localStorage.getItem('feedingLogs');
    const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
    
    // Add sample logs with unique IDs
    const logsWithIds = sampleLogs.map(log => ({
      ...log,
      id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    
    // Combine existing and new logs
    const combinedLogs = [...logsWithIds, ...existingLogs];
    
    // Save back to local storage
    localStorage.setItem('feedingLogs', JSON.stringify(combinedLogs));
    
    console.log("Sample logs added to local storage successfully!");
    return { success: true, message: "Sample logs added to local storage successfully!" };
  } catch (error) {
    console.error("Error adding sample logs to local storage:", error);
    return { success: false, message: "Error adding sample logs to local storage." };
  }
};
