import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent(`
      Given these tasks with priorities: ${prompt}
      Suggest a new, different task that might logically come next or complement the existing tasks.
      The suggestion should be short (max 10 words) and include a recommended priority (low, medium, or high).
      Focus on potential follow-up actions or related but distinct tasks.
      Format the response as: "Task: [task description] | Priority: [priority]"
    `);
    const response = await result.response;
    const text = response.text().trim();
    return NextResponse.json({ result: text });
  } catch (error: unknown) {
    console.error('Error in AI assist:', error);
    return NextResponse.json({ error: 'Failed to generate AI suggestion' }, { status: 500 });
  }
}