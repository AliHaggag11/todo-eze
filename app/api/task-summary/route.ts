import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Task } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { userId, timeframe } = await req.json();
    const supabase = createClientComponentClient();

    const startDate = timeframe === 'daily' ? new Date(new Date().setHours(0,0,0,0)) : new Date(new Date().setDate(new Date().getDate() - 7));

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const completedTasks = tasks.filter((t: Task) => t.is_complete);
    const pendingTasks = tasks.filter((t: Task) => !t.is_complete);
    const highPriorityTasks = tasks.filter((t: Task) => t.priority === 'high' && !t.is_complete);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      Generate a ${timeframe} task summary based on the following data:
      
      Total tasks: ${tasks.length}
      Completed tasks: ${completedTasks.length}
      Pending tasks: ${pendingTasks.length}
      High priority pending tasks: ${highPriorityTasks.length}

      Recently completed tasks:
      ${completedTasks.slice(0, 5).map((t: Task) => `- ${t.title}`).join('\n')}

      High priority pending tasks:
      ${highPriorityTasks.slice(0, 5).map((t: Task) => `- ${t.title}`).join('\n')}

      Provide a concise summary including:
      1. Task completion rate (percentage and fraction)
      2. Highlight of recent accomplishments (completed tasks)
      3. Focus areas (high priority pending tasks)
      4. Patterns or trends in task completion
      5. Actionable suggestions for improving productivity based on the data

      If there's insufficient data, provide general productivity tips relevant to the current state.
      Format the response in Markdown, using appropriate headers and bullet points.
    `;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating task summary:', error);
    return NextResponse.json({ error: 'Failed to generate task summary' }, { status: 500 });
  }
}