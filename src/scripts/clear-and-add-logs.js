// Script to clear all existing data and add only the specified feeding logs
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, addDoc } = require('firebase/firestore');

// Firebase configuration from .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

async function clearAndAddLogs() {
  try {
    // Step 1: Clear all existing logs
    console.log('Clearing existing logs...');
    const logsCollection = collection(db, "feedingLogs");
    const snapshot = await getDocs(logsCollection);
    
    const deletePromises = [];
    snapshot.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log(`Deleted ${deletePromises.length} existing logs.`);
    
    // Step 2: Add new logs
    console.log('Adding new logs...');
    const addPromises = feedingLogs.map(log => addDoc(logsCollection, log));
    await Promise.all(addPromises);
    
    console.log(`Successfully added ${feedingLogs.length} logs.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
clearAndAddLogs();
