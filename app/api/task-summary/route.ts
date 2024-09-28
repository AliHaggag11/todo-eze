import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { userId, timeframe } = await req.json();
    const supabase = createClientComponentClient();

    // Fetch tasks for the user
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      Generate a ${timeframe} summary of the following tasks:
      ${tasks.map((t: any) => `- ${t.title} (Priority: ${t.priority}, Completed: ${t.is_complete})`).join('\n')}
      
      Provide a concise summary including:
      1. Number of completed tasks
      2. Number of pending tasks
      3. High priority tasks that need attention
      4. Any patterns or trends in task completion
      5. Suggestions for improving productivity

      Format the response in Markdown.
    `;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating task summary:', error);
    return NextResponse.json({ error: 'Failed to generate task summary' }, { status: 500 });
  }
}