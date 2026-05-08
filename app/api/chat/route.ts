import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { systemPrompt } from "@/lib/data";

const client = new OpenAI({
  apiKey: process.env.ARK_API_KEY,
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
});

export async function POST(req: NextRequest) {
  try {
    const { messages, userProfile } = await req.json();

    // 方舟 responses API：system 用 instructions，history 用 input
    const response = await client.responses.create({
      model: "deepseek-v3-2-251201",
      instructions: systemPrompt(userProfile || "未设置画像"),
      input: messages,
    });

    const text = response.output_text ?? "抱歉，出了点问题 🥲";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "API call failed" }, { status: 500 });
  }
}
