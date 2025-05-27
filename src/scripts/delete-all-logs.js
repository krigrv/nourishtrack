// Script to delete all logs from Firestore
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function deleteAllLogs() {
  try {
    const logsCollection = collection(db, "feedingLogs");
    const snapshot = await getDocs(logsCollection);
    
    let deletedCount = 0;
    const deletePromises = [];
    
    snapshot.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
      deletedCount++;
    });
    
    await Promise.all(deletePromises);
    console.log(`Successfully deleted ${deletedCount} logs.`);
    return { success: true, count: deletedCount };
  } catch (error) {
    console.error('Error deleting logs:', error);
    return { success: false, error: error.message };
  }
}
