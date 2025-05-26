"use client";

import React, { useState, useEffect } from "react";
import { Baby, History, RefreshCw } from "lucide-react";
import { FeedingLogForm } from "@/components/feeding-log-form";
import { PastEntries } from "@/components/past-entries";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  const [dailyQuote, setDailyQuote] = useState("");
  const [showPastEntries, setShowPastEntries] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  
  // Array of mother-centric motivational quotes
  const quotes = [
    "Your love and care are nurturing a beautiful soul.",
    "Every feeding is an act of love that strengthens your bond.",
    "You're doing amazing work, one feeding at a time.",
    "Your strength and patience are your baby's greatest gifts.",
    "In the rhythm of feeding, find your peaceful moments.",
    "Today's challenges are tomorrow's cherished memories.",
    "Your dedication to nurturing is changing the world, one baby at a time.",
    "The love between a mother and child is the strongest force in nature.",
    "Trust your instincts—they're guiding you perfectly.",
    "Each day with your baby is a precious gift to treasure.",
    "The journey of motherhood reveals strength you never knew you had.",
    "Your baby's smile is proof that you're doing everything right.",
    "Small moments of connection create a lifetime of love.",
    "Motherhood: the most challenging and rewarding role you'll ever have.",
    "Your presence is the greatest present for your baby."
  ];
  
  // Set daily quote based on the day of the month
  useEffect(() => {
    const quoteIndex = new Date().getDate() % quotes.length;
    setDailyQuote(quotes[quoteIndex]);
  }, []);
  
  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-between">
      {/* Header Section */}
      <div className="w-full max-w-md mx-auto text-center mb-8">
        <div className="flex justify-center items-center mb-2">
          <div className="baby-icon-container p-3 rounded-full">
            <Baby className="h-12 w-12 baby-icon" aria-hidden="true" />
          </div>
          {showPastEntries && (
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full ml-4" 
              onClick={() => {
                setRefreshKey(prev => prev + 1);
                toast({
                  description: "Past entries refreshed",
                });
              }}
              title="Refresh past entries"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="sr-only">Refresh past entries</span>
            </Button>
          )}
        </div>
        <h1 className="text-4xl font-bold mb-2">NourishTrack</h1>
        <h2 className="text-2xl font-semibold mb-2">Hey Chandralekha, How are you?</h2>
        <p className="text-muted-foreground italic">"{dailyQuote}"</p>
      </div>
      
      {/* Main Content */}
      <div className="w-full max-w-3xl mx-auto mb-8">
        {/* Feeding Log Form */}
        <div className="mb-8">
          <FeedingLogForm 
            onTogglePastEntries={() => {
              setShowPastEntries(!showPastEntries);
              if (!showPastEntries) {
                setRefreshKey(prev => prev + 1);
              }
            }}
            showPastEntries={showPastEntries}
          />
        </div>
        
        {/* Past Entries (Conditional) */}
        {showPastEntries && (
          <div className="mt-8">
            <PastEntries 
              key={refreshKey}
              onDelete={async (id) => {
                // Handle deletion from local storage
                try {
                  const storedEntries = localStorage.getItem('feedingLogs');
                  if (storedEntries) {
                    const entries = JSON.parse(storedEntries);
                    const filteredEntries = entries.filter((entry: any) => entry.id !== id);
                    localStorage.setItem('feedingLogs', JSON.stringify(filteredEntries));
                  }
                  return Promise.resolve();
                } catch (error) {
                  console.error('Error deleting entry:', error);
                  return Promise.reject(error);
                }
              }} 
            />
          </div>
        )}
      </div>
      
      {/* Footer Section */}
      <footer className="w-full text-center text-sm text-muted-foreground py-4">
        © {currentYear} NourishTrack. Made by your lovely husband
      </footer>
    </main>
  );
}
