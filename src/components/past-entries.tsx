"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ChevronUp, 
  Trash2 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { FeedingLogData } from "@/lib/types";

interface PastEntriesProps {
  onDelete?: (id: string) => Promise<void>;
}

export function PastEntries({ onDelete }: PastEntriesProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<(FeedingLogData & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load past entries from local storage
  useEffect(() => {
    const loadEntries = () => {
      try {
        const storedEntries = localStorage.getItem('feedingLogs');
        if (storedEntries) {
          const parsedEntries = JSON.parse(storedEntries);
          setEntries(parsedEntries);
        }
      } catch (error) {
        console.error('Error loading past entries:', error);
        toast({
          description: "Failed to load past entries",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [toast]);

  // Handle entry deletion
  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(id);
      setEntries(entries.filter(entry => entry.id !== id));
      toast({
        description: "Entry deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        description: "Failed to delete entry",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    try {
      return format(new Date(date), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Past Entries</CardTitle>
          <CardDescription>Loading your feeding history...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="animate-pulse flex flex-col space-y-4 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-md w-full"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Past Entries</CardTitle>
          <CardDescription>Your feeding history will appear here</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground mb-4">No entries yet</p>
          <p className="text-sm">Submit your first feeding log to see it here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Entries</CardTitle>
        <CardDescription>Your recent feeding history</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {entries.sort((a, b) => {
              // Sort by the most recent date in dateTimeEntries
              const aDate = a.dateTimeEntries[0]?.date ? new Date(a.dateTimeEntries[0].date) : new Date(0);
              const bDate = b.dateTimeEntries[0]?.date ? new Date(b.dateTimeEntries[0].date) : new Date(0);
              return bDate.getTime() - aDate.getTime();
            }).map((entry) => (
              <Collapsible key={entry.id} className="border rounded-lg overflow-hidden">
                <div className="bg-card p-4 flex justify-between items-center">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {entry.dateTimeEntries[0]?.date 
                          ? formatDate(entry.dateTimeEntries[0].date)
                          : "No date"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {entry.dateTimeEntries[0]?.time || "No time"} • {entry.duration} min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {entry.breast}
                    </Badge>
                    <CollapsibleTrigger className="rounded-full p-1 hover:bg-accent">
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="p-4 bg-muted/30 border-t">
                    <dl className="space-y-2 text-sm">
                      {entry.dateTimeEntries.length > 1 && (
                        <div>
                          <dt className="font-medium">Additional Times:</dt>
                          <dd className="text-muted-foreground mt-1">
                            {entry.dateTimeEntries.slice(1).map((dt, i) => (
                              <div key={i} className="ml-2">
                                {dt.date ? formatDate(dt.date) : "No date"} at {dt.time || "No time"}
                              </div>
                            ))}
                          </dd>
                        </div>
                      )}
                      
                      {entry.unlatchReason && (
                        <div>
                          <dt className="font-medium">Unlatch Reason:</dt>
                          <dd className="text-muted-foreground mt-1 capitalize">{entry.unlatchReason}</dd>
                        </div>
                      )}
                      
                      {entry.notes && (
                        <div>
                          <dt className="font-medium">Notes:</dt>
                          <dd className="text-muted-foreground mt-1">{entry.notes}</dd>
                        </div>
                      )}
                      
                      {entry.pumpNotes && (
                        <div>
                          <dt className="font-medium">Pump Notes:</dt>
                          <dd className="text-muted-foreground mt-1">{entry.pumpNotes}</dd>
                        </div>
                      )}
                    </dl>
                    
                    {onDelete && (
                      <div className="mt-4 flex justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive/90"
                              onClick={() => setDeleteId(entry.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Entry</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this feeding log entry? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => setDeleteId(null)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => deleteId && handleDelete(deleteId)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Showing {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </p>
      </CardFooter>
    </Card>
  );
}
