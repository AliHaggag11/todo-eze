import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return NextResponse.json({ result: text });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}