import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserAccounts } from "@/actions/dashboard";
import { getAccountWithTransactions } from "@/actions/account";
import { getFinancialSummary, getTransactionsByCategory } from "@/actions/ai-data";

// You can choose one of these AI providers:
// 1. OpenAI GPT
// 2. Google Gemini (you already have this setup)
// 3. Anthropic Claude

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Using Google Gemini (since you already have it)
async function callGeminiAI(messages, tools) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    }),
  });

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that request.";
}

// Alternative: Using OpenAI
async function callOpenAI(messages, tools) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
      tools: tools,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I couldn't process that request.";
}

// Tool definitions for the AI
const availableTools = [
  {
    name: "get_user_accounts",
    description: "Get all user accounts with balances and transaction counts",
    parameters: { type: "object", properties: {}, required: [] }
  },
  {
    name: "get_account_transactions",
    description: "Get transactions for a specific account",
    parameters: {
      type: "object",
      properties: {
        accountId: { type: "string", description: "The account ID" },
        limit: { type: "number", description: "Number of transactions to fetch" }
      },
      required: ["accountId"]
    }
  },
  {
    name: "analyze_spending",
    description: "Analyze user's spending patterns and financial summary",
    parameters: { type: "object", properties: {}, required: [] }
  },
  {
    name: "get_category_transactions",
    description: "Get transactions by category",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", description: "Transaction category" },
        limit: { type: "number", description: "Number of transactions to fetch" }
      },
      required: ["category"]
    }
  }
];

// Execute tool functions
async function executeTool(toolName, parameters) {
  switch (toolName) {
    case "get_user_accounts":
      const accounts = await getUserAccounts();
      return {
        success: true,
        data: accounts,
        message: `Found ${accounts.length} accounts`
      };

    case "get_account_transactions":
      const accountData = await getAccountWithTransactions(parameters.accountId);
      if (!accountData) {
        return { success: false, error: "Account not found" };
      }
      const transactions = accountData.transactions.slice(0, parameters.limit || 10);
      return {
        success: true,
        data: { account: accountData, transactions },
        message: `Retrieved ${transactions.length} transactions`
      };

    case "analyze_spending":
      const summary = await getFinancialSummary();
      return summary;

    case "get_category_transactions":
      const categoryTxns = await getTransactionsByCategory(parameters.category, parameters.limit || 10);
      return categoryTxns;

    default:
      return { success: false, error: "Unknown tool" };
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, chatHistory = [] } = await req.json();

    // Check if the message requires tool usage
    const toolMatch = detectToolNeeded(message);
    let toolResult = null;

    if (toolMatch) {
      toolResult = await executeTool(toolMatch.tool, toolMatch.parameters);
    }

    // Prepare context for AI
    let systemPrompt = `You are a helpful financial assistant for BaChatBhai app. You help users manage their finances, analyze spending, and understand their financial data.

Available information:
- User has accounts with balances and transactions
- You can analyze spending patterns
- You can show transaction history
- You can help with account management

Guidelines:
- Be helpful and friendly
- Provide actionable financial advice
- Use the data provided to give specific insights
- Format numbers as currency (Rs X.XX)
- Keep responses concise but informative`;

    if (toolResult && toolResult.success) {
      systemPrompt += `\n\nCurrent data context: ${JSON.stringify(toolResult.data)}`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: message }
    ];

    // Call AI service (using Gemini by default, can switch to OpenAI)
    const aiResponse = await callGeminiAI(messages, availableTools);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      toolResult: toolResult
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({
      success: false,
      error: "Something went wrong with the AI chat"
    }, { status: 500 });
  }
}

// Simple tool detection (you can make this more sophisticated)
function detectToolNeeded(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("account") && (lowerMessage.includes("show") || lowerMessage.includes("list"))) {
    return { tool: "get_user_accounts", parameters: {} };
  }
  
  if (lowerMessage.includes("transaction") && lowerMessage.includes("recent")) {
    return { tool: "get_account_transactions", parameters: { limit: 10 } };
  }
  
  if (lowerMessage.includes("spending") || lowerMessage.includes("analyze")) {
    return { tool: "analyze_spending", parameters: {} };
  }
  
  if (lowerMessage.includes("category") || lowerMessage.includes("food") || lowerMessage.includes("transport")) {
    // Extract category from message (simple approach)
    const categories = ["food", "transport", "housing", "entertainment", "shopping", "healthcare"];
    const foundCategory = categories.find(cat => lowerMessage.includes(cat));
    if (foundCategory) {
      return { tool: "get_category_transactions", parameters: { category: foundCategory } };
    }
  }
  
  return null;
}