import { NextResponse } from "next/server";
import { getAccountWithTransactions } from "@/actions/account";
import { auth } from "@clerk/nextjs/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta2/models/chat-bison-001:generateMessage`;

export async function POST(req) {
  try {
    const { question, accountId } = await req.json();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountData = await getAccountWithTransactions(accountId);
    if (!accountData || !accountData.transactions.length) {
      return NextResponse.json({ answer: "No transactions found for this account." });
    }

    const transactions = accountData.transactions.slice(0, 10).map((tx) => ({
      date: tx.createdAt,
      amount: tx.amount,
      category: tx.category,
      type: tx.type,
      note: tx.note,
    }));

    const prompt = `
You are a helpful financial assistant.

The user asked: "${question}"

Here are their recent transactions:

${transactions.map(t => `• ${t.date} | Rs ${t.amount} | ${t.category} | ${t.note || ''}`).join('\n')}

Answer briefly and helpfully based only on this data.
    `.trim();

    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: {
          messages: [
            {
              author: "user",
              content: prompt,
            },
          ],
        },
        temperature: 0.5,
        candidateCount: 1,
      }),
    });

    const data = await geminiRes.json();
    console.log("Gemini Response:", JSON.stringify(data, null, 2));

    let answer = "AI could not generate a response.";
    if (data?.candidates?.[0]?.content) {
      answer = data.candidates[0].content;
    } else if (data?.promptFeedback?.blockReason) {
      answer = `Blocked by Gemini: ${data.promptFeedback.blockReason}`;
    } else if (data?.error?.message) {
      answer = `Gemini Error: ${data.error.message}`;
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
