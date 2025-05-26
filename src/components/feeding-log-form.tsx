"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { format } from "date-fns";
import { Baby, Loader2, PlusCircle, Trash2, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/components/ui/use-toast";
import { submitFeedingLog } from "@/app/actions";
import { FeedingLogData, FeedingLogSchema, unlatchReasons } from "@/lib/types";

interface FeedingLogFormProps {
  onTogglePastEntries?: () => void;
  showPastEntries?: boolean;
}

export function FeedingLogForm({ onTogglePastEntries, showPastEntries = false }: FeedingLogFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<FeedingLogData>({
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
    } as FeedingLogData,
  });

  // Setup field array for multiple date/time entries
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "dateTimeEntries",
  });

  // Set current date and time for the first entry after initial mount
  useEffect(() => {
    if (typeof window !== "undefined" && fields.length > 0) {
      const now = new Date();
      const currentTime = format(now, "HH:mm");
      
      form.setValue("dateTimeEntries.0.date", now);
      form.setValue("dateTimeEntries.0.time", currentTime);
    }
  }, [form, fields.length]);

  // Handle form submission
  const onSubmit = async (data: FeedingLogData) => {
    setIsSubmitting(true);
    try {
      const result = await submitFeedingLog(data);
      
      if (result.success) {
        // Save to local storage
        try {
          const storedEntries = localStorage.getItem('feedingLogs');
          const entries = storedEntries ? JSON.parse(storedEntries) : [];
          
          // Create a new entry with a unique ID
          const newEntry = {
            ...data,
            id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          };
          
          // Add to the beginning of the array
          entries.unshift(newEntry);
          
          // Save back to local storage
          localStorage.setItem('feedingLogs', JSON.stringify(entries));
        } catch (storageError) {
          console.error('Error saving to local storage:', storageError);
        }
        
        toast({
          description: result.message,
        });
        
        // Reset form with a new current date/time for the first entry
        form.reset({
          dateTimeEntries: [{ date: new Date(), time: "" }],
          duration: 0,
          breastOptions: {
            left: false,
            right: false,
          },
          unlatchReason: null,
          notes: "",
          pumpNotes: "",
        } as FeedingLogData);
        
        // Set current date and time for the first entry
        const now = new Date();
        const currentTime = format(now, "HH:mm");
        
        form.setValue("dateTimeEntries.0.date", now);
        form.setValue("dateTimeEntries.0.time", currentTime);
      } else {
        toast({
          variant: "destructive",
          description: result.message || "Failed to submit feeding log",
        });
      }
    } catch (error) {
      console.error('Error submitting feeding log:', error);
      toast({
        variant: "destructive",
        description: "An error occurred while submitting the feeding log",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a new date/time entry with current date and time
  const addNewEntry = () => {
    const now = new Date();
    append({ date: now, time: format(now, "HH:mm") });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Baby className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Log New Feeding Session</CardTitle>
        </div>
        {onTogglePastEntries && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onTogglePastEntries}
            aria-label={showPastEntries ? "Hide past entries" : "Show past entries"}
          >
            <History className={`h-5 w-5 ${showPastEntries ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>
        )}
      </CardHeader>
      <CardDescription className="px-6 pb-2">
        Record details about your baby's feeding session
      </CardDescription>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data as FeedingLogData))} className="space-y-6">
            {/* Date/Time Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium">Date & Time</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewEntry}
                  className="h-8 px-2"
                >
                  <PlusCircle className="mr-1 h-4 w-4" />
                  Add Time
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="relative flex flex-col gap-4 rounded-md border p-4 md:flex-row">
                  {/* Date Field */}
                  <FormField
                    control={form.control}
                    name={`dateTimeEntries.${index}.date`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 max-w-[95vw] md:max-w-[350px]" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Time Field */}
                  <FormField
                    control={form.control}
                    name={`dateTimeEntries.${index}.time`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Remove Button (if more than one entry) */}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Duration Field */}
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={240}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the total duration in minutes (1-240)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Breast Options Field with Checkboxes */}
            <div className="space-y-3">
              <FormLabel>Breast</FormLabel>
              <div className="flex flex-wrap gap-6">
                <FormField
                  control={form.control}
                  name="breastOptions.left"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 m-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="breast-left"
                        />
                      </FormControl>
                      <FormLabel 
                        htmlFor="breast-left" 
                        className="font-normal capitalize cursor-pointer"
                      >
                        Left
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="breastOptions.right"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 m-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="breast-right"
                        />
                      </FormControl>
                      <FormLabel 
                        htmlFor="breast-right" 
                        className="font-normal capitalize cursor-pointer"
                      >
                        Right
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <FormMessage />
            </div>
            
            {/* Unlatch Reason Field */}
            <FormField
              control={form.control}
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
            
            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this feeding session"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Pump Notes Field */}
            <FormField
              control={form.control}
              name="pumpNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pump Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes about pumping (if applicable)"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional pump-related notes (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feeding Log"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
