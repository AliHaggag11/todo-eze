import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';

interface TaskSummaryProps {
  userId: string;
}

export function TaskSummary({ userId }: TaskSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSummary = async (timeframe: 'daily' | 'weekly') => {
    setIsLoading(true);
    setSummary(null);
    try {
      const response = await fetch('/api/task-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, timeframe }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({ title: "Error", description: "Failed to generate summary. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Task Summary</h2>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Button 
          onClick={() => generateSummary('daily')} 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Generate Daily Summary
        </Button>
        <Button 
          onClick={() => generateSummary('weekly')} 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Generate Weekly Summary
        </Button>
      </div>
      {isLoading && <p>Generating summary...</p>}
      {summary && (
        <div className="prose dark:prose-invert max-w-full">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}