"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO, isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";
import { saveAs } from "file-saver";
import { Baby, Calendar as CalendarIcon, Clock, Edit, Filter, Info, Trash2, X, Download, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addSampleLogsToFirestore, addSampleLogsToLocalStorage } from "@/scripts/add-sample-logs";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FeedingLogSchema, unlatchReasons } from "@/lib/types";

interface PastEntriesProps {
  onDelete: (id: string) => Promise<void>;
}

interface FeedingLogEntry {
  id: string;
  dateTimeEntries: Array<{ date: string; time: string }>;
  duration: number;
  breastOptions: { left: boolean; right: boolean };
  unlatchReason: string | null;
  notes: string;
  pumpNotes: string;
  createdAt: string;
}

interface DateFilter {
  startDate: Date | null;
  endDate: Date | null;
}

interface EnhancedFilter extends DateFilter {
  minDuration: number | null;
  maxDuration: number | null;
  breastSide: 'all' | 'left' | 'right' | 'both' | null;
  unlatchReason: string | null;
}

export function PastEntries({ onDelete }: PastEntriesProps): React.ReactNode {
  const [entries, setEntries] = useState<FeedingLogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<FeedingLogEntry[]>([]);
  const [allEntries, setAllEntries] = useState<FeedingLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [sampleLoadStatus, setSampleLoadStatus] = useState<{success: boolean, message: string} | null>(null);
  // State for temporary filter (what's shown in the UI)
  const [tempFilter, setTempFilter] = useState<EnhancedFilter>({
    startDate: null,
    endDate: null,
    minDuration: null,
    maxDuration: null,
    breastSide: null,
    unlatchReason: null
  });
  
  // State for applied filter (what's actually used for filtering)
  const [appliedFilter, setAppliedFilter] = useState<EnhancedFilter>({
    startDate: null,
    endDate: null,
    minDuration: null,
    maxDuration: null,
    breastSide: null,
    unlatchReason: null
  });
  
  // For backward compatibility with existing code
  const tempDateFilter = tempFilter;
  const setTempDateFilter = (filter: DateFilter) => {
    setTempFilter(prev => ({ ...prev, ...filter }));
  };
  
  const appliedDateFilter = appliedFilter;
  const setAppliedDateFilter = (filter: DateFilter) => {
    setAppliedFilter(prev => ({ ...prev, ...filter }));
  };
  const [editingEntry, setEditingEntry] = useState<FeedingLogEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  
  // Initialize edit form
  const editForm = useForm({
    resolver: zodResolver(FeedingLogSchema),
    defaultValues: {
      dateTimeEntries: [{ date: new Date(), time: "" }],
      duration: 0,
      breastOptions: {
        left: false,
        right: false,
      },
      unlatchReason: null,
      notes: "",
      pumpNotes: "",
    },
  });

  // Function to fetch entries from Firestore
  const fetchEntriesFromFirestore = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching entries from Firestore...');
      
      // Create a query to get the most recent entries
      // Increased limit to 100 to get more historical data
      const q = query(
        collection(db, "feedingLogs"), 
        orderBy("createdAt", "desc"), 
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} entries in Firestore`);
      
      const firestoreEntries: FeedingLogEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          
          // Log the raw data retrieved from Firestore for debugging
          console.log(`Retrieved document ${doc.id} from Firestore:`, JSON.stringify(data, null, 2));
          
          // Ensure data structure is valid
          if (!data.dateTimeEntries || !Array.isArray(data.dateTimeEntries)) {
            console.warn(`Invalid dateTimeEntries for document ${doc.id}`, data);
            return; // Skip this entry
          }
          
          // Process dateTimeEntries to ensure consistent time format
          const processedDateTimeEntries = data.dateTimeEntries.map(entry => {
            // Log the time format from Firestore
            console.log("Time format from Firestore:", entry.time);
            
            let timeValue = entry.time;
            // Ensure time is in the expected format for display
            if (timeValue && timeValue.includes(":")) {
              // Check if the time is in 24-hour format
              const [hours, minutes] = timeValue.split(":");
              const hour = parseInt(hours, 10);
              const minute = parseInt(minutes, 10);
              
              // Convert to display format if needed (for UI consistency)
              if (!timeValue.toLowerCase().includes("am") && !timeValue.toLowerCase().includes("pm")) {
                // Convert 24-hour format to 12-hour format for display
                const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                const period = hour >= 12 ? "PM" : "AM";
                timeValue = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
                console.log("Converted time for display:", timeValue);
              }
            }
            
            return {
              date: entry.date,
              time: timeValue
            };
          });
          
          firestoreEntries.push({
            id: doc.id,
            dateTimeEntries: processedDateTimeEntries || [{ date: new Date().toISOString(), time: "00:00" }],
            duration: data.duration || 0,
            breastOptions: data.breastOptions || { left: false, right: false },
            unlatchReason: data.unlatchReason || null,
            notes: data.notes || "",
            pumpNotes: data.pumpNotes || "",
            createdAt: data.createdAt?.toDate?.() 
              ? data.createdAt.toDate().toISOString() 
              : new Date().toISOString()
          });
          
          // Log the processed entry
          console.log("Processed entry for display:", JSON.stringify(firestoreEntries[firestoreEntries.length - 1], null, 2));
        } catch (docError) {
          console.error(`Error processing document ${doc.id}:`, docError);
        }
      });
      
      // Try to get local entries as backup
      let localEntries: FeedingLogEntry[] = [];
      try {
        const storedEntries = localStorage.getItem('feedingLogs');
        if (storedEntries) {
          const parsedEntries = JSON.parse(storedEntries);
          if (Array.isArray(parsedEntries)) {
            console.log(`Found ${parsedEntries.length} entries in local storage`);
            localEntries = parsedEntries;
          } else {
            console.warn('Local storage feedingLogs is not an array:', parsedEntries);
          }
        } else {
          console.log('No entries found in local storage');
        }
      } catch (error) {
        console.error('Error loading from local storage:', error);
      }
      
      // Merge entries, prioritizing Firestore entries
      const mergedEntries = [...firestoreEntries];
      console.log(`Merging ${firestoreEntries.length} Firestore entries with ${localEntries.length} local entries`);
      
      // Add local entries that don't exist in Firestore
      localEntries.forEach(localEntry => {
        try {
          if (localEntry && localEntry.id && !firestoreEntries.some(fsEntry => fsEntry.id === localEntry.id)) {
            // Ensure the entry has all required fields
            const validatedEntry = {
              id: localEntry.id,
              dateTimeEntries: Array.isArray(localEntry.dateTimeEntries) ? localEntry.dateTimeEntries : [{ date: new Date().toISOString(), time: "00:00" }],
              duration: typeof localEntry.duration === 'number' ? localEntry.duration : 0,
              breastOptions: localEntry.breastOptions || { left: false, right: false },
              unlatchReason: localEntry.unlatchReason || null,
              notes: localEntry.notes || "",
              pumpNotes: localEntry.pumpNotes || "",
              createdAt: localEntry.createdAt || new Date().toISOString()
            };
            mergedEntries.push(validatedEntry);
          }
        } catch (entryError) {
          console.error('Error processing local entry:', entryError);
        }
      });
      
      // Sort by createdAt date (newest first)
      mergedEntries.sort((a, b) => {
        try {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } catch (sortError) {
          console.error('Error sorting entries:', sortError);
          return 0;
        }
      });
      
      console.log(`Total merged entries: ${mergedEntries.length}`);
      
      // Store all entries for filtering
      setAllEntries(mergedEntries);
      setFilteredEntries(mergedEntries);
      setEntries(mergedEntries);
    } catch (error) {
      console.error('Error fetching entries from Firestore:', error);
      toast({
        variant: "destructive",
        description: "Failed to load feeding logs from cloud storage. Showing local data only.",
      });
      
      // Fallback to local storage
      try {
        console.log('Falling back to local storage...');
        const storedEntries = localStorage.getItem('feedingLogs');
        if (storedEntries) {
          const parsedData = JSON.parse(storedEntries);
          if (Array.isArray(parsedData)) {
            console.log(`Found ${parsedData.length} entries in local storage fallback`);
            // Validate and clean up entries
            const validatedEntries = parsedData.filter(entry => entry && entry.id).map(entry => ({
              id: entry.id,
              dateTimeEntries: Array.isArray(entry.dateTimeEntries) ? entry.dateTimeEntries : [{ date: new Date().toISOString(), time: "00:00" }],
              duration: typeof entry.duration === 'number' ? entry.duration : 0,
              breastOptions: entry.breastOptions || { left: false, right: false },
              unlatchReason: entry.unlatchReason || null,
              notes: entry.notes || "",
              pumpNotes: entry.pumpNotes || "",
              createdAt: entry.createdAt || new Date().toISOString()
            }));
            
            setAllEntries(validatedEntries);
            setFilteredEntries(validatedEntries);
            setEntries(validatedEntries);
          } else {
            console.warn('Local storage feedingLogs is not an array:', parsedData);
            setAllEntries([]);
            setFilteredEntries([]);
            setEntries([]);
          }
        } else {
          console.log('No entries found in local storage fallback');
          setAllEntries([]);
          setFilteredEntries([]);
          setEntries([]);
        }
      } catch (error) {
        console.error('Error loading from local storage fallback:', error);
        setAllEntries([]);
        setFilteredEntries([]);
        setEntries([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // State for delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Function to initiate delete process
  const confirmDelete = (id: string) => {
    setEntryToDelete(id);
    setDeleteConfirmOpen(true);
  };

  // Function to handle entry deletion after confirmation
  const handleDelete = async () => {
    if (!entryToDelete) return;
    
    const id = entryToDelete;
    setDeleteConfirmOpen(false);
    setEntryToDelete(null);
    
    try {
      // Optimistic UI update - remove from state immediately
      const entryToRemove = entries.find(entry => entry.id === id);
      const updatedEntries = entries.filter(entry => entry.id !== id);
      setEntries(updatedEntries);
      setFilteredEntries(filteredEntries.filter(entry => entry.id !== id));
      setAllEntries(allEntries.filter(entry => entry.id !== id));
      
      // Show toast immediately
      const toastId = toast({
        description: "Deleting feeding log...",
      });
      
      // Delete from Firestore
      try {
        console.log(`Deleting document with ID: ${id} from Firestore`);
        await deleteDoc(doc(db, "feedingLogs", id));
        console.log('Successfully deleted document from Firestore');
      } catch (error) {
        console.error('Error deleting from Firestore:', error);
        // Rollback UI state on error
        if (entryToRemove) {
          setEntries([...updatedEntries, entryToRemove]);
          setFilteredEntries(prev => entryToRemove ? [...prev, entryToRemove] : prev);
          setAllEntries(prev => entryToRemove ? [...prev, entryToRemove] : prev);
        }
        throw error;
      }
      
      // Call the parent component's onDelete function (for local storage)
      await onDelete(id);
      
      // Update toast to success
      toast({
        description: "Feeding log deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        variant: "destructive",
        description: "Failed to delete feeding log",
      });
    }
  };

  // Apply all filters to entries
  const applyFilters = () => {
    // Apply the temporary filter to the actual filter
    setAppliedFilter(tempFilter);
    
    // Check if any filters are active
    const hasDateFilter = tempFilter.startDate || tempFilter.endDate;
    const hasDurationFilter = tempFilter.minDuration || tempFilter.maxDuration;
    const hasBreastFilter = tempFilter.breastSide && tempFilter.breastSide !== 'all';
    const hasUnlatchFilter = tempFilter.unlatchReason && tempFilter.unlatchReason !== 'none';
    
    if (!hasDateFilter && !hasDurationFilter && !hasBreastFilter && !hasUnlatchFilter) {
      // No filters, show all entries
      setFilteredEntries(allEntries);
      return;
    }

    const filtered = allEntries.filter(entry => {
      // Get the date from the first dateTimeEntry
      const entryDate = entry.dateTimeEntries[0]?.date
        ? new Date(typeof entry.dateTimeEntries[0].date === 'string'
          ? entry.dateTimeEntries[0].date
          : entry.dateTimeEntries[0].date)
        : new Date(entry.createdAt);

      // Check start date filter
      if (tempFilter.startDate && !isAfter(entryDate, startOfDay(tempFilter.startDate)) && !isEqual(entryDate, tempFilter.startDate)) {
        return false;
      }

      // Check end date filter
      if (tempFilter.endDate && !isBefore(entryDate, endOfDay(tempFilter.endDate)) && !isEqual(entryDate, tempFilter.endDate)) {
        return false;
      }
      
      // Check duration filters
      if (tempFilter.minDuration !== null && entry.duration < tempFilter.minDuration) {
        return false;
      }
      
      if (tempFilter.maxDuration !== null && entry.duration > tempFilter.maxDuration) {
        return false;
      }
      
      // Check breast side filter
      if (hasBreastFilter) {
        if (tempFilter.breastSide === 'left' && !entry.breastOptions.left) {
          return false;
        }
        if (tempFilter.breastSide === 'right' && !entry.breastOptions.right) {
          return false;
        }
        if (tempFilter.breastSide === 'both' && (!entry.breastOptions.left || !entry.breastOptions.right)) {
          return false;
        }
      }
      
      // Check unlatch reason filter
      if (hasUnlatchFilter && entry.unlatchReason !== tempFilter.unlatchReason) {
        return false;
      }

      return true;
    });

    setFilteredEntries(filtered);
    console.log(`Applied filters: ${JSON.stringify(tempFilter, null, 2)}`);
    console.log(`Filtered entries: ${filtered.length} of ${allEntries.length}`);
  };
  
  // For backward compatibility
  const applyDateFilter = applyFilters;

  // Apply filters when applied filter changes
  useEffect(() => {
    // Check if any filters are active
    const hasDateFilter = appliedFilter.startDate || appliedFilter.endDate;
    const hasDurationFilter = appliedFilter.minDuration || appliedFilter.maxDuration;
    const hasBreastFilter = appliedFilter.breastSide && appliedFilter.breastSide !== 'all';
    const hasUnlatchFilter = appliedFilter.unlatchReason && appliedFilter.unlatchReason !== 'none';
    
    if (hasDateFilter || hasDurationFilter || hasBreastFilter || hasUnlatchFilter) {
      // Only auto-apply filters when they're already set
      const filtered = allEntries.filter(entry => {
        // Get the date from the first dateTimeEntry
        const entryDate = entry.dateTimeEntries[0]?.date
          ? new Date(typeof entry.dateTimeEntries[0].date === 'string'
            ? entry.dateTimeEntries[0].date
            : entry.dateTimeEntries[0].date)
          : new Date(entry.createdAt);
  
        // Check start date filter
        if (appliedFilter.startDate && !isAfter(entryDate, startOfDay(appliedFilter.startDate)) && !isEqual(entryDate, appliedFilter.startDate)) {
          return false;
        }
  
        // Check end date filter
        if (appliedFilter.endDate && !isBefore(entryDate, endOfDay(appliedFilter.endDate)) && !isEqual(entryDate, appliedFilter.endDate)) {
          return false;
        }
        
        // Check duration filters
        if (appliedFilter.minDuration !== null && entry.duration < appliedFilter.minDuration) {
          return false;
        }
        
        if (appliedFilter.maxDuration !== null && entry.duration > appliedFilter.maxDuration) {
          return false;
        }
        
        // Check breast side filter
        if (hasBreastFilter) {
          if (appliedFilter.breastSide === 'left' && !entry.breastOptions.left) {
            return false;
          }
          if (appliedFilter.breastSide === 'right' && !entry.breastOptions.right) {
            return false;
          }
          if (appliedFilter.breastSide === 'both' && (!entry.breastOptions.left || !entry.breastOptions.right)) {
            return false;
          }
        }
        
        // Check unlatch reason filter
        if (hasUnlatchFilter && entry.unlatchReason !== appliedFilter.unlatchReason) {
          return false;
        }
  
        return true;
      });
  
      setFilteredEntries(filtered);
      console.log(`Applied filters from effect: ${JSON.stringify(appliedFilter, null, 2)}`);
      console.log(`Filtered entries: ${filtered.length} of ${allEntries.length}`);
    } else {
      setFilteredEntries(allEntries);
    }
  }, [appliedFilter, allEntries]);

  // Fetch entries when component mounts
  useEffect(() => {
    fetchEntriesFromFirestore();
  }, []);

  // Format the breast options for display
  const formatBreastOptions = (options: { left: boolean; right: boolean }) => {
    if (options.left && options.right) return "Left & Right";
    if (options.left) return "Left";
    if (options.right) return "Right";
    return "None";
  };

  // Function to handle entry editing
  const handleEdit = async (entry: FeedingLogEntry) => {
    setEditingEntry(entry);
    setIsEditing(true);

    // Convert dates from string to Date objects for the form
    const dateTimeEntries = entry.dateTimeEntries.map(dt => {
      // Ensure date is in the correct format for the form
      let dateValue;
      if (typeof dt.date === 'string') {
        dateValue = dt.date; // Keep as ISO string for the form
      } else {
        // Convert Date object to ISO string
        dateValue = new Date(dt.date).toISOString();
      }
      
      return {
        date: dateValue,
        time: dt.time
      };
    });

    // Set form values
    editForm.reset({
      dateTimeEntries,
      duration: entry.duration,
      breastOptions: entry.breastOptions,
      // Ensure unlatchReason is one of the allowed values or 'none'
      unlatchReason: unlatchReasons.includes(entry.unlatchReason as any) ? entry.unlatchReason as any : 'none',
      notes: entry.notes || "",
      pumpNotes: entry.pumpNotes || ""
    });
  };

  // Function to save edited entry
  const saveEditedEntry = async (data: any) => {
    if (!editingEntry) return;

    try {
      // Format the data properly for Firestore
      const formattedData = {
        ...data,
        // Handle the 'none' value for unlatchReason
        unlatchReason: data.unlatchReason === 'none' ? null : data.unlatchReason,
        // Ensure dateTimeEntries is properly formatted
        dateTimeEntries: data.dateTimeEntries.map((dt: any) => ({
          date: dt.date, // Already in ISO string format from the form
          time: dt.time
        })),
        // Keep the original createdAt timestamp
        // but add an updatedAt timestamp
        updatedAt: serverTimestamp()
      };

      // Update in Firestore
      try {
        console.log('Saving edited entry to Firestore:', JSON.stringify(formattedData, null, 2));
        console.log('Document ID:', editingEntry.id);
        await updateDoc(doc(db, "feedingLogs", editingEntry.id), formattedData);
        console.log('Successfully updated document in Firestore');
      } catch (error) {
        console.error('Error updating Firestore document:', error);
      }

      // Update in local storage
      try {
        const storedEntries = localStorage.getItem('feedingLogs');
        if (storedEntries) {
          const entries = JSON.parse(storedEntries);
          const updatedEntries = entries.map((entry: any) => {
            if (entry.id === editingEntry.id) {
              return {
                ...entry,
                ...formattedData,
                // Use ISO string for local storage instead of server timestamp
                updatedAt: new Date().toISOString()
              };
            }
            return entry;
          });
          localStorage.setItem('feedingLogs', JSON.stringify(updatedEntries));
        }
      } catch (error) {
        console.error('Error updating local storage:', error);
      }

      // Update state
      const updatedEntries = allEntries.map(entry => {
        if (entry.id === editingEntry.id) {
          return {
            ...entry,
            ...formattedData,
            // Use ISO string for state update instead of server timestamp
            updatedAt: new Date().toISOString()
          };
        }
        return entry;
      });

      setAllEntries(updatedEntries);
      // Filtering will be applied automatically via useEffect

      toast({
        description: "Feeding log updated successfully",
      });

      setIsEditing(false);
      setEditingEntry(null);

      // Refresh data
      fetchEntriesFromFirestore();
    } catch (error) {
      console.error('Error saving edited entry:', error);
      toast({
        variant: "destructive",
        description: "Failed to update feeding log",
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setTempFilter({
      startDate: null,
      endDate: null,
      minDuration: null,
      maxDuration: null,
      breastSide: null,
      unlatchReason: null
    });
    setAppliedFilter({
      startDate: null,
      endDate: null,
      minDuration: null,
      maxDuration: null,
      breastSide: null,
      unlatchReason: null
    });
    setFilteredEntries(allEntries);
  };

  // Calculate analytics data
  const calculateAnalytics = () => {
    const dataToAnalyze = filteredEntries.length > 0 ? filteredEntries : allEntries;
    
    // Average feed duration
    const totalDuration = dataToAnalyze.reduce((sum, entry) => sum + entry.duration, 0);
    const avgDuration = dataToAnalyze.length > 0 ? Math.round(totalDuration / dataToAnalyze.length) : 0;
    
    // Calculate average feeds per day
    let feedsPerDay = 0;
    if (dataToAnalyze.length > 0) {
      // Group entries by date
      const feedsByDate: Record<string, number> = {};
      dataToAnalyze.forEach(entry => {
        if (entry.dateTimeEntries && entry.dateTimeEntries.length > 0) {
          const dateStr = entry.dateTimeEntries[0].date.split('T')[0]; // Get YYYY-MM-DD format
          feedsByDate[dateStr] = (feedsByDate[dateStr] || 0) + 1;
        }
      });
      
      // Calculate average
      const totalDays = Object.keys(feedsByDate).length;
      const totalFeeds = Object.values(feedsByDate).reduce((sum, count) => sum + count, 0);
      feedsPerDay = totalDays > 0 ? Math.round((totalFeeds / totalDays) * 10) / 10 : 0; // Round to 1 decimal
    }
    
    // Most used breast
    let leftCount = 0;
    let rightCount = 0;
    dataToAnalyze.forEach(entry => {
      if (entry.breastOptions?.left) leftCount++;
      if (entry.breastOptions?.right) rightCount++;
    });
    const mostUsedBreast = leftCount > rightCount ? 'Left' : rightCount > leftCount ? 'Right' : 'Equal usage';
    const breastUsageData = {
      left: leftCount,
      right: rightCount,
      mostUsed: mostUsedBreast,
      total: leftCount + rightCount
    };
    
    // Most common unlatch reason
    const unlatchReasons = dataToAnalyze
      .filter(entry => entry.unlatchReason) // Filter out null/undefined reasons
      .map(entry => entry.unlatchReason);
    
    const reasonCounts: Record<string, number> = {};
    unlatchReasons.forEach(reason => {
      if (reason) {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
    });
    
    let mostCommonReason = 'None recorded';
    let maxCount = 0;
    
    Object.entries(reasonCounts).forEach(([reason, count]) => {
      if (count > maxCount) {
        mostCommonReason = reason;
        maxCount = count;
      }
    });
    
    return {
      avgDuration,
      feedsPerDay,
      breastUsageData,
      mostCommonReason,
      totalEntries: dataToAnalyze.length
    };
  };
  
  // Get analytics data
  const analytics = calculateAnalytics();
  
  // Export entries to CSV
  const exportToCSV = () => {
    try {
      // Use filtered entries if available, otherwise use all entries
      const dataToExport = filteredEntries.length > 0 ? filteredEntries : allEntries;
      
      if (dataToExport.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no feeding logs to export.",
          variant: "destructive"
        });
        return;
      }
      
      // CSV header
      const headers = [
        "Date", 
        "Time", 
        "Duration (min)", 
        "Left Breast", 
        "Right Breast", 
        "Unlatch Reason", 
        "Notes", 
        "Pump Notes",
        "Created At"
      ];
      
      // Convert entries to CSV rows
      const csvRows = dataToExport.map(entry => {
        try {
          // Format date and time
          const dateStr = entry.dateTimeEntries[0]?.date 
            ? format(new Date(entry.dateTimeEntries[0].date), "yyyy-MM-dd")
            : "";
          const timeStr = entry.dateTimeEntries[0]?.time || "";
          
          // Format breast options
          const leftBreast = entry.breastOptions?.left ? "Yes" : "No";
          const rightBreast = entry.breastOptions?.right ? "Yes" : "No";
          
          // Format created at date
          const createdAtStr = entry.createdAt 
            ? format(new Date(entry.createdAt), "yyyy-MM-dd HH:mm:ss")
            : "";
          
          return [
            dateStr,
            timeStr,
            entry.duration.toString(),
            leftBreast,
            rightBreast,
            entry.unlatchReason || "",
            entry.notes || "",
            entry.pumpNotes || "",
            createdAtStr
          ];
        } catch (error) {
          console.error('Error processing entry for CSV:', error);
          return ["", "", "", "", "", "", "", "", ""];
        }
      });
      
      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...csvRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const fileName = `nourishtrack-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
      saveAs(blob, fileName);
      
      toast({
        title: "Export Successful",
        description: `${dataToExport.length} feeding logs exported to ${fileName}`,
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your feeding logs.",
        variant: "destructive"
      });
    }
  };
  
  // Load sample logs
  const handleLoadSampleLogs = async () => {
    try {
      setIsLoadingSamples(true);
      setSampleLoadStatus(null);
      
      // Add to Firestore
      const firestoreResult = await addSampleLogsToFirestore();
      
      // Add to local storage (as backup)
      if (typeof window !== 'undefined') {
        addSampleLogsToLocalStorage();
      }
      
      setSampleLoadStatus({
        success: firestoreResult.success,
        message: firestoreResult.message
      });
      
      // Refresh logs to show the newly added sample data
      // Re-fetch logs from Firestore
      try {
        setIsLoading(true);
        const logsCollection = collection(db, "feedingLogs");
        const q = query(logsCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        console.log(`Retrieved ${querySnapshot.size} documents from Firestore`);
        
        const firestoreEntries: FeedingLogEntry[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`Processing document ${doc.id} from Firestore:`, JSON.stringify(data, null, 2));
          
          // Skip invalid entries
          if (!data) {
            console.log(`Skipping document ${doc.id} - no data`);
            return;
          }
          
          // Process date and time from Firestore
          // This ensures we have a consistent format
          const dateTimeEntries = data.dateTimeEntries || [{
            date: data.date || new Date().toISOString(),
            time: data.time || "00:00"
          }];
          
          const entry: FeedingLogEntry = {
            id: doc.id,
            dateTimeEntries,
            duration: data.duration || 0,
            breastOptions: data.breastOptions || { left: false, right: false },
            unlatchReason: data.unlatchReason || null,
            notes: data.notes || "",
            pumpNotes: data.pumpNotes || "",
            createdAt: data.createdAt?.toDate?.() 
              ? data.createdAt.toDate().toISOString() 
              : new Date().toISOString()
          };
          
          console.log(`Processed entry for document ${doc.id}:`, JSON.stringify(entry, null, 2));
          firestoreEntries.push(entry);
        });
        
        setEntries(firestoreEntries);
        setAllEntries(firestoreEntries);
        setFilteredEntries(firestoreEntries);
        setIsLoading(false);
      } catch (fetchError) {
        console.error("Error fetching logs after adding samples:", fetchError);
        setIsLoading(false);
      }
      
      toast({
        title: firestoreResult.success ? "Sample Logs Added" : "Error Adding Logs",
        description: firestoreResult.message,
        variant: firestoreResult.success ? "default" : "destructive"
      });
      
      setIsLoadingSamples(false);
    } catch (error) {
      console.error('Error loading sample logs:', error);
      setSampleLoadStatus({
        success: false,
        message: 'Failed to load sample logs. Please try again.'
      });
      toast({
        title: "Error Adding Sample Logs",
        description: "There was an error adding the sample logs.",
        variant: "destructive"
      });
      setIsLoadingSamples(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Past Feeding Logs</CardTitle>
          <CardDescription>
            Your feeding history
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={exportToCSV}
            disabled={isExporting || entries.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          
          {/* Date Filter Controls */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter</span>
                {(tempDateFilter.startDate || tempDateFilter.endDate) && (
                  <span className="ml-1 rounded-full bg-primary w-2 h-2" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Date Range</h4>
                  <div className="grid gap-2">
                    <div className="grid gap-1">
                      <label className="text-xs">Start Date</label>
                      <CalendarComponent
                        mode="single"
                        selected={tempFilter.startDate || undefined}
                        onSelect={(date) => setTempFilter({ ...tempFilter, startDate: date || null })}
                        className="border rounded-md p-3"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-xs">End Date</label>
                      <CalendarComponent
                        mode="single"
                        selected={tempFilter.endDate || undefined}
                        onSelect={(date) => setTempFilter({ ...tempFilter, endDate: date || null })}
                        className="border rounded-md p-3"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 border-t pt-2">
                  <h4 className="font-medium text-sm">Duration (minutes)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1">
                      <label className="text-xs">Minimum</label>
                      <Input 
                        type="number" 
                        value={tempFilter.minDuration || ''}
                        onChange={(e) => setTempFilter({ 
                          ...tempFilter, 
                          minDuration: e.target.value ? parseInt(e.target.value) : null 
                        })}
                        className="h-8"
                        min="0"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-xs">Maximum</label>
                      <Input 
                        type="number" 
                        value={tempFilter.maxDuration || ''}
                        onChange={(e) => setTempFilter({ 
                          ...tempFilter, 
                          maxDuration: e.target.value ? parseInt(e.target.value) : null 
                        })}
                        className="h-8"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 border-t pt-2">
                  <h4 className="font-medium text-sm">Breast Side</h4>
                  <Select
                    value={tempFilter.breastSide || 'all'}
                    onValueChange={(value) => setTempFilter({ 
                      ...tempFilter, 
                      breastSide: value === 'all' ? null : value as 'left' | 'right' | 'both' 
                    })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sides</SelectItem>
                      <SelectItem value="left">Left Only</SelectItem>
                      <SelectItem value="right">Right Only</SelectItem>
                      <SelectItem value="both">Both Sides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 border-t pt-2">
                  <h4 className="font-medium text-sm">Unlatch Reason</h4>
                  <Select
                    value={tempFilter.unlatchReason || 'none'}
                    onValueChange={(value) => setTempFilter({ 
                      ...tempFilter, 
                      unlatchReason: value === 'none' ? null : value 
                    })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any Reason</SelectItem>
                      {unlatchReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason.charAt(0).toUpperCase() + reason.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={() => applyFilters()}>Apply Filters</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      
      {/* Analytics - 2x2 Grid with Card Borders */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/5 border-y border-border/20">
        {/* Row 1 */}
        <div className="border rounded-md p-3 flex flex-col items-center justify-center text-center">
          <Clock className="h-4 w-4 text-primary mb-1" />
          <span className="text-xs text-muted-foreground">Average Duration</span>
          <span className="text-sm font-medium">{analytics.avgDuration} min</span>
        </div>
        
        <div className="border rounded-md p-3 flex flex-col items-center justify-center text-center">
          <Baby className="h-4 w-4 text-primary mb-1" />
          <span className="text-xs text-muted-foreground">Most Used Breast</span>
          <span className="text-sm font-medium">{analytics.breastUsageData.mostUsed}</span>
        </div>
        
        {/* Row 2 */}
        <div className="border rounded-md p-3 flex flex-col items-center justify-center text-center">
          <Info className="h-4 w-4 text-primary mb-1" />
          <span className="text-xs text-muted-foreground">Common Unlatch</span>
          <span className="text-sm font-medium">{analytics.mostCommonReason}</span>
        </div>
        
        <div className="border rounded-md p-3 flex flex-col items-center justify-center text-center">
          <CalendarIcon className="h-4 w-4 text-primary mb-1" />
          <span className="text-xs text-muted-foreground">Feeds Per Day</span>
          <span className="text-sm font-medium">{analytics.feedsPerDay}</span>
        </div>
      </div>
      
      {/* Filter Status */}
      {(appliedFilter.startDate || appliedFilter.endDate || appliedFilter.minDuration || appliedFilter.maxDuration || 
        appliedFilter.breastSide || appliedFilter.unlatchReason) && (
        <div className="px-6 py-2 bg-muted/50 flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Filters:</span>
            
            {/* Date filters */}
            {(appliedFilter.startDate || appliedFilter.endDate) && (
              <div className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold">
                <span>
                  Date: 
                  {appliedFilter.startDate && (
                    <span>From {format(appliedFilter.startDate, "MMM d, yyyy")}</span>
                  )}
                  {appliedFilter.startDate && appliedFilter.endDate && " "}
                  {appliedFilter.endDate && (
                    <span>To {format(appliedFilter.endDate, "MMM d, yyyy")}</span>
                  )}
                </span>
              </div>
            )}
            
            {/* Duration filters */}
            {(appliedFilter.minDuration !== null || appliedFilter.maxDuration !== null) && (
              <div className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold">
                <span>
                  Duration: 
                  {appliedFilter.minDuration !== null && (
                    <span>Min {appliedFilter.minDuration}min</span>
                  )}
                  {appliedFilter.minDuration !== null && appliedFilter.maxDuration !== null && " - "}
                  {appliedFilter.maxDuration !== null && (
                    <span>Max {appliedFilter.maxDuration}min</span>
                  )}
                </span>
              </div>
            )}
            
            {/* Breast side filter */}
            {appliedFilter.breastSide && (
              <div className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold">
                <span>
                  Breast: 
                  {appliedFilter.breastSide === 'left' && "Left Only"}
                  {appliedFilter.breastSide === 'right' && "Right Only"}
                  {appliedFilter.breastSide === 'both' && "Both Sides"}
                </span>
              </div>
            )}
            
            {/* Unlatch reason filter */}
            {appliedFilter.unlatchReason && (
              <div className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold">
                <span>
                  Unlatch: {appliedFilter.unlatchReason.charAt(0).toUpperCase() + appliedFilter.unlatchReason.slice(1)}
                </span>
              </div>
            )}
            
            <span className="text-xs text-muted-foreground ml-1">({filteredEntries.length} results)</span>
          </div>
          
          <Button variant="ghost" size="icon" onClick={clearFilters} className="h-7 w-7" aria-label="Clear all filters">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEntries.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="space-y-6">
              {/* Group entries by date */}
              {(() => {
                // Sort entries by date (newest first)
                const sortedEntries = [...filteredEntries].sort((a, b) => {
                  const dateA = typeof a.dateTimeEntries[0].date === 'string' 
                    ? new Date(a.dateTimeEntries[0].date).getTime() 
                    : new Date(a.dateTimeEntries[0].date).getTime();
                  const dateB = typeof b.dateTimeEntries[0].date === 'string' 
                    ? new Date(b.dateTimeEntries[0].date).getTime() 
                    : new Date(b.dateTimeEntries[0].date).getTime();
                  return dateB - dateA; // Newest first
                });
                
                // Group by date
                const groupedEntries: Record<string, FeedingLogEntry[]> = {};
                
                sortedEntries.forEach(entry => {
                  try {
                    const dateValue = typeof entry.dateTimeEntries[0].date === 'string' 
                      ? parseISO(entry.dateTimeEntries[0].date) 
                      : new Date(entry.dateTimeEntries[0].date);
                    
                    if (isNaN(dateValue.getTime())) {
                      return;
                    }
                    
                    const dateKey = format(dateValue, "yyyy-MM-dd");
                    const displayDate = format(dateValue, "EEEE, MMMM d, yyyy");
                    
                    if (!groupedEntries[dateKey]) {
                      groupedEntries[dateKey] = {
                        entries: [],
                        displayDate
                      } as any;
                    }
                    
                    (groupedEntries[dateKey] as any).entries.push(entry);
                  } catch (error) {
                    console.error('Error grouping entry by date:', error);
                  }
                });
                
                // Sort groups by date (newest first)
                const sortedGroups = Object.keys(groupedEntries).sort().reverse();
                
                return sortedGroups.map(dateKey => (
                  <div key={dateKey} className="space-y-3">
                    <h3 className="text-sm font-semibold px-1 py-2 bg-muted/30 rounded-md relative">
                      {(groupedEntries[dateKey] as any).displayDate}
                    </h3>
                    
                    <div className="space-y-3 pl-2">
                      {(groupedEntries[dateKey] as any).entries.map((entry: FeedingLogEntry) => (
                        <Card key={entry.id} className="p-4 relative hover:shadow-md transition-shadow duration-200">
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(entry)}
                              aria-label="Edit entry"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => confirmDelete(entry.id)}
                              aria-label="Delete entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center mb-3 text-primary">
                            <Clock className="h-4 w-4 mr-1.5" />
                            <span className="text-sm font-medium">{entry.dateTimeEntries[0]?.time || "N/A"}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-2">
                            <div className="bg-muted/20 p-2 rounded-md">
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="text-sm font-medium">{entry.duration} minutes</p>
                            </div>
                            
                            <div className="bg-muted/20 p-2 rounded-md">
                              <p className="text-xs text-muted-foreground">Breast</p>
                              <p className="text-sm font-medium">{formatBreastOptions(entry.breastOptions)}</p>
                            </div>
                            
                            {entry.unlatchReason && (
                              <div className="bg-muted/20 p-2 rounded-md">
                                <p className="text-xs text-muted-foreground">Unlatch Reason</p>
                                <p className="text-sm font-medium">{entry.unlatchReason}</p>
                              </div>
                            )}
                          </div>
                          
                          {(entry.notes || entry.pumpNotes) && (
                            <div className="mt-3 border-t pt-2 border-dashed border-muted">
                              {entry.notes && (
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground">Notes</p>
                                  <p className="text-sm">{entry.notes}</p>
                                </div>
                              )}
                              {entry.pumpNotes && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Pump Notes</p>
                                  <p className="text-sm">{entry.pumpNotes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {appliedDateFilter.startDate || appliedDateFilter.endDate 
                ? "No feeding logs found for the selected date range" 
                : "No feeding logs found"}
            </p>
          </div>
        )}
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feeding log entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Feeding Log</DialogTitle>
            <DialogDescription>
              Update the details of this feeding log entry.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(saveEditedEntry)} className="space-y-4">
              {/* Date and Time */}
              <FormField
                control={editForm.control}
                name="dateTimeEntries.0.date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date.toISOString());
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="dateTimeEntries.0.time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Duration */}
              <FormField
                control={editForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Breast Options */}
              <div className="space-y-2">
                <FormLabel>Breast</FormLabel>
                <div className="flex space-x-4">
                  <FormField
                    control={editForm.control}
                    name="breastOptions.left"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            id="breast-left"
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel htmlFor="breast-left" className="text-sm font-normal">Left</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="breastOptions.right"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            id="breast-right"
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel htmlFor="breast-right" className="text-sm font-normal">Right</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Unlatch Reason */}
              <FormField
                control={editForm.control}
                name="unlatchReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unlatch Reason</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {unlatchReasons.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason.charAt(0).toUpperCase() + reason.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Notes */}
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Pump Notes */}
              <FormField
                control={editForm.control}
                name="pumpNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pump Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
