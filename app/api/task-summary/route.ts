import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Task } from '@/lib/types';

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

    // Process task data
    const completedTasks = tasks.filter((t: Task) => t.is_complete);
    const pendingTasks = tasks.filter((t: Task) => !t.is_complete);
    const highPriorityTasks = tasks.filter((t: Task) => t.priority === 'high' && !t.is_complete);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      Generate a ${timeframe} summary of the following task data:
      
      Total tasks: ${tasks.length}
      Completed tasks: ${completedTasks.length}
      Pending tasks: ${pendingTasks.length}
      High priority pending tasks: ${highPriorityTasks.length}

      Recent completed tasks:
      ${completedTasks.slice(0, 5).map((t: Task) => `- ${t.title}`).join('\n')}

      Upcoming high priority tasks:
      ${highPriorityTasks.slice(0, 5).map((t: Task) => `- ${t.title}`).join('\n')}

      Provide a concise summary including:
      1. Overview of task completion rate
      2. Highlight of recent accomplishments (completed tasks)
      3. Focus areas (high priority pending tasks)
      4. Any patterns or trends in task completion
      5. Suggestions for improving productivity based on the data

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