"use client";

import React, { useState, useEffect } from "react";
import { Baby, RefreshCw, PlusCircle, History } from "lucide-react";
import { FeedingLogForm } from "@/components/feeding-log-form";
import { PastEntries } from "@/components/past-entries";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [dailyQuote, setDailyQuote] = useState("");
  const [activeTab, setActiveTab] = useState("new-entry");
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
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-between bg-gradient-to-b from-background to-muted/30">
      {/* Header Section */}
      <div className="w-full max-w-md mx-auto text-left mb-6 md:mb-8 animate-fade-in">
        <div className="flex justify-start items-center mb-3 relative">
          <div className="baby-icon-container p-3 rounded-full bg-primary/10 shadow-sm">
            <img src="/icons/breast-icon.png" alt="Breast icon" className="h-10 w-10 md:h-12 md:w-12" aria-hidden="true" />
          </div>
          {activeTab === "past-logs" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4 absolute right-0 top-1/2 -translate-y-1/2 shadow-sm hover:shadow transition-all duration-200" 
              onClick={() => {
                setRefreshKey(prev => prev + 1);
                toast({
                  description: "Past entries refreshed",
                  className: "bg-primary/10 border-primary/20 text-foreground",
                });
              }}
              title="Refresh past entries"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">NourishTrack</h1>
        <h2 className="text-xl md:text-2xl font-semibold mb-3 text-primary/90">Hey Chandralekha, How are you?</h2>
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border/50 max-w-sm">
          <p className="text-muted-foreground italic text-sm md:text-base">"{dailyQuote}"</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="w-full max-w-md mx-auto mb-8 px-1 sm:px-4">
        <Tabs 
          defaultValue="new-entry" 
          value={activeTab} 
          onValueChange={(value: string) => {
            setActiveTab(value);
            if (value === "past-logs") {
              setRefreshKey(prev => prev + 1);
            }
          }}
          className="w-full"
        >
          <div className="border-b border-border/50 mb-4">
            <TabsList className="flex w-full mb-0 bg-transparent space-x-0 h-9">
              <TabsTrigger 
                value="new-entry" 
                className="flex items-center justify-center px-3 py-1.5 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all duration-200 -mb-px"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                New Entry
              </TabsTrigger>
              <div className="h-5 w-px bg-border/50 self-center mx-1"></div>
              <TabsTrigger 
                value="past-logs" 
                className="flex items-center justify-center px-3 py-1.5 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all duration-200 -mb-px"
              >
                <History className="h-3.5 w-3.5 mr-1.5" />
                Past Logs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new-entry" className="mt-0">
            <FeedingLogForm />
          </TabsContent>

          <TabsContent value="past-logs" className="mt-0">
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
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer Section */}
      <footer className="w-full text-center text-sm text-muted-foreground py-6 mt-auto border-t border-border/30">
        <div className="max-w-md mx-auto px-4">
          <p className="mb-2">&copy; {currentYear} NourishTrack</p>
          <p className="text-xs opacity-70">Made with ❤️ by your lovely husband</p>
        </div>
      </footer>
    </main>
  );
}
