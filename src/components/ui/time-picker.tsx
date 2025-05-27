"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import TimePicker from "react-time-picker"
import "react-time-picker/dist/TimePicker.css"
import "react-clock/dist/Clock.css"

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
}

export function TimePickerComponent({ value, onChange, className }: TimePickerProps) {
  // State to store the display format for the UI
  const [displayValue, setDisplayValue] = React.useState<string>("");
  
  // Convert the time format for internal use (24-hour format)
  const formatTimeForDisplay = (time: string): string => {
    if (!time) return ""
    
    // If the time is already in 24-hour format (HH:mm), return it
    if (/^\d{1,2}:\d{2}$/.test(time)) {
      return time
    }
    
    // Try to parse AM/PM format
    try {
      const [timePart, meridiem] = time.split(/\s+/)
      const [hours, minutes] = timePart.split(":")
      let hour = parseInt(hours, 10)
      
      if (meridiem?.toUpperCase() === "PM" && hour < 12) {
        hour += 12
      } else if (meridiem?.toUpperCase() === "AM" && hour === 12) {
        hour = 0
      }
      
      return `${hour.toString().padStart(2, "0")}:${minutes}`
    } catch (e) {
      // If parsing fails, return the original value
      return time
    }
  }
  
  // Format time for display in the UI (12-hour format with AM/PM)
  const formatForUI = (time: string): string => {
    if (!time) return ""
    
    try {
      const [hours, minutes] = time.split(":")
      const hour = parseInt(hours, 10)
      const minute = parseInt(minutes, 10)
      
      let displayHour = hour % 12
      if (displayHour === 0) displayHour = 12
      
      const meridiem = hour >= 12 ? "PM" : "AM"
      
      return `${displayHour}:${minute.toString().padStart(2, "0")} ${meridiem}`
    } catch (e) {
      return time
    }
  }
  
  // Update display value when the component mounts or value changes
  React.useEffect(() => {
    if (value) {
      // Store the original format for display
      setDisplayValue(value);
    }
  }, [value]);
  
  // Convert back from 24-hour format to validation format
  const formatTimeForOutput = (time: string | null): string => {
    if (!time) return ""
    
    try {
      // Return the time in 24-hour format for validation
      const [hours, minutes] = time.split(":")
      const hour = parseInt(hours, 10)
      const minute = parseInt(minutes, 10)
      
      // Format as HH:MM for validation schema
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    } catch (e) {
      return time
    }
  }
  
  const handleChange = (newTime: string | null) => {
    onChange(formatTimeForOutput(newTime))
  }

  return (
    <div className={cn("w-full", className)}>
      <TimePicker
        onChange={handleChange}
        value={formatTimeForDisplay(value)}
        clearIcon={null}
        clockIcon={<Clock className="h-4 w-4 opacity-70" />}
        disableClock={true}
        format="h:mm a"
        hourPlaceholder="hh"
        minutePlaceholder="mm"
        className="w-full react-time-picker"
        // Display the time in 12-hour format
        locale="en-US"
      />
    </div>
  )
}
