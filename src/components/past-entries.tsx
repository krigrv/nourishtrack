"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO, isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns";
import { Calendar, Edit, Filter, Trash2, X } from "lucide-react";
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

export function PastEntries({ onDelete }: PastEntriesProps) {
  const [entries, setEntries] = useState<FeedingLogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<FeedingLogEntry[]>([]);
  const [allEntries, setAllEntries] = useState<FeedingLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ startDate: null, endDate: null });
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
          // Ensure data structure is valid
          if (!data.dateTimeEntries || !Array.isArray(data.dateTimeEntries)) {
            console.warn(`Invalid dateTimeEntries for document ${doc.id}`, data);
            return; // Skip this entry
          }
          
          firestoreEntries.push({
            id: doc.id,
            dateTimeEntries: data.dateTimeEntries || [{ date: new Date().toISOString(), time: "00:00" }],
            duration: data.duration || 0,
            breastOptions: data.breastOptions || { left: false, right: false },
            unlatchReason: data.unlatchReason || null,
            notes: data.notes || "",
            pumpNotes: data.pumpNotes || "",
            createdAt: data.createdAt?.toDate?.() 
              ? data.createdAt.toDate().toISOString() 
              : new Date().toISOString()
          });
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

  // Function to handle entry deletion
  const handleDelete = async (id: string) => {
    try {
      // Delete from Firestore
      try {
        await deleteDoc(doc(db, "feedingLogs", id));
      } catch (error) {
        console.error('Error deleting from Firestore:', error);
      }
      
      // Call the parent component's onDelete function (for local storage)
      await onDelete(id);
      
      // Update state
      setEntries(entries.filter(entry => entry.id !== id));
      
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

  // Apply date filters to entries
  const applyDateFilter = () => {
    if (!dateFilter.startDate && !dateFilter.endDate) {
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
      if (dateFilter.startDate && !isAfter(entryDate, startOfDay(dateFilter.startDate)) && !isEqual(entryDate, dateFilter.startDate)) {
        return false;
      }

      // Check end date filter
      if (dateFilter.endDate && !isBefore(entryDate, endOfDay(dateFilter.endDate)) && !isEqual(entryDate, dateFilter.endDate)) {
        return false;
      }

      return true;
    });

    setFilteredEntries(filtered);
  };

  // Apply filters when filter changes
  useEffect(() => {
    applyDateFilter();
  }, [dateFilter, allEntries]);

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
    const dateTimeEntries = entry.dateTimeEntries.map(dt => ({
      date: typeof dt.date === 'string' ? new Date(dt.date) : dt.date,
      time: dt.time
    }));

    // Set form values
    editForm.reset({
      dateTimeEntries,
      duration: entry.duration,
      breastOptions: entry.breastOptions,
      // Ensure unlatchReason is one of the allowed values or null
      unlatchReason: unlatchReasons.includes(entry.unlatchReason as any) ? entry.unlatchReason as any : null,
      notes: entry.notes,
      pumpNotes: entry.pumpNotes
    });
  };

  // Function to save edited entry
  const saveEditedEntry = async (data: any) => {
    if (!editingEntry) return;

    try {
      // Update in Firestore
      try {
        await updateDoc(doc(db, "feedingLogs", editingEntry.id), {
          ...data,
          // Keep the original createdAt timestamp
          // but add an updatedAt timestamp
          updatedAt: serverTimestamp()
        });
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
                ...data,
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
            ...data,
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

  // Clear date filters
  const clearFilters = () => {
    setDateFilter({ startDate: null, endDate: null });
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
          {/* Date Filter Controls */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter</span>
                {(dateFilter.startDate || dateFilter.endDate) && (
                  <span className="ml-1 rounded-full bg-primary w-2 h-2" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Date Range</h4>
                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <label className="text-xs">Start Date</label>
                    <CalendarComponent
                      mode="single"
                      selected={dateFilter.startDate || undefined}
                      onSelect={(date) => setDateFilter({ ...dateFilter, startDate: date || null })}
                      className="border rounded-md p-3"
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs">End Date</label>
                    <CalendarComponent
                      mode="single"
                      selected={dateFilter.endDate || undefined}
                      onSelect={(date) => setDateFilter({ ...dateFilter, endDate: date || null })}
                      className="border rounded-md p-3"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                  <Button size="sm" onClick={() => applyDateFilter()}>Apply</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      
      {/* Filter Status */}
      {(dateFilter.startDate || dateFilter.endDate) && (
        <div className="px-6 py-2 bg-muted/50 flex items-center justify-between">
          <span className="text-sm">
            Filtering: 
            {dateFilter.startDate && (
              <span className="font-medium"> From {
                (() => {
                  try {
                    return isNaN(dateFilter.startDate.getTime()) 
                      ? "Invalid date" 
                      : format(dateFilter.startDate, "MMM d, yyyy");
                  } catch (error) {
                    console.error('Error formatting start date:', error);
                    return "Invalid date";
                  }
                })()
              }</span>
            )}
            {dateFilter.endDate && (
              <span className="font-medium"> To {
                (() => {
                  try {
                    return isNaN(dateFilter.endDate.getTime()) 
                      ? "Invalid date" 
                      : format(dateFilter.endDate, "MMM d, yyyy");
                  } catch (error) {
                    console.error('Error formatting end date:', error);
                    return "Invalid date";
                  }
                })()
              }</span>
            )}
            {" "} ({filteredEntries.length} results)
          </span>
          <Button variant="ghost" size="icon" onClick={clearFilters} className="h-7 w-7">
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
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="p-4 relative">
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
                      onClick={() => handleDelete(entry.id)}
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-sm font-medium">Date & Time</p>
                      <p className="text-sm">
                        {entry.dateTimeEntries[0]?.date
                          ? (() => {
                              try {
                                const dateValue = typeof entry.dateTimeEntries[0].date === 'string' 
                                  ? parseISO(entry.dateTimeEntries[0].date) 
                                  : new Date(entry.dateTimeEntries[0].date);
                                
                                // Validate the date is valid before formatting
                                if (isNaN(dateValue.getTime())) {
                                  return "Invalid date";
                                }
                                
                                return format(dateValue, "MMM d, yyyy");
                              } catch (error) {
                                console.error('Error formatting date:', error, entry.dateTimeEntries[0].date);
                                return "Invalid date";
                              }
                            })()
                          : "N/A"}{" "}
                        at {entry.dateTimeEntries[0]?.time || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm">{entry.duration} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Breast</p>
                      <p className="text-sm">{formatBreastOptions(entry.breastOptions)}</p>
                    </div>
                    {entry.unlatchReason && (
                      <div>
                        <p className="text-sm font-medium">Unlatch Reason</p>
                        <p className="text-sm">{entry.unlatchReason}</p>
                      </div>
                    )}
                  </div>
                  
                  {(entry.notes || entry.pumpNotes) && (
                    <div className="mt-2">
                      {entry.notes && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">Notes</p>
                          <p className="text-sm">{entry.notes}</p>
                        </div>
                      )}
                      {entry.pumpNotes && (
                        <div>
                          <p className="text-sm font-medium">Pump Notes</p>
                          <p className="text-sm">{entry.pumpNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {dateFilter.startDate || dateFilter.endDate 
                ? "No feeding logs found for the selected date range" 
                : "No feeding logs found"}
            </p>
          </div>
        )}
      </CardContent>
      
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
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Left</FormLabel>
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
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Right</FormLabel>
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
                        <SelectItem value="">None</SelectItem>
                        {unlatchReasons.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason.charAt(0).toUpperCase() + reason.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
