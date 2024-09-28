import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { tasks } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      Given these tasks:
      ${tasks.map((t: any) => `${t.title} (Priority: ${t.priority})`).join('\n')}
      
      Group these tasks into 3-5 logical categories or projects. Respond with a JSON object where keys are category names and values are arrays of task indices (0-based).
      For example: {"Work": [0, 2], "Personal": [1, 3], "Health": [4]}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const groupings = JSON.parse(response.text());
    return NextResponse.json(groupings);
  } catch (error) {
    console.error('Error in task grouping:', error);
    return NextResponse.json({ error: 'Failed to group tasks' }, { status: 500 });
  }
}