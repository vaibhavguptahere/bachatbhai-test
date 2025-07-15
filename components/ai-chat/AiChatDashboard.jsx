"use client";

import { useState } from "react";
import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { ClientSideSuspense } from "@liveblocks/react";
import { AiChat } from "@liveblocks/react-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X } from "lucide-react";

// AI Tools for financial data
const useAiTools = () => {
  const callTool = async (toolName, parameters = {}) => {
    try {
      const response = await fetch("/api/ai-tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: toolName,
          parameters,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Tool call error:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    getUserAccounts: () => callTool("get_user_accounts"),
    getAccountTransactions: (accountId, limit) => 
      callTool("get_account_transactions", { accountId, limit }),
    analyzeSpending: () => callTool("analyze_spending"),
  };
};

function AiChatInterface() {
  const room = useRoom();
  const self = useSelf();
  const tools = useAiTools();

  const handleToolCall = async (toolName, parameters) => {
    switch (toolName) {
      case "get_accounts":
        return await tools.getUserAccounts();
      case "get_transactions":
        return await tools.getAccountTransactions(
          parameters.accountId, 
          parameters.limit
        );
      case "analyze_spending":
        return await tools.analyzeSpending();
      case "get_financial_summary":
        return await callTool("get_financial_summary");
      case "get_category_transactions":
        return await callTool("get_category_transactions", parameters);
      default:
        return { success: false, error: "Unknown tool" };
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <AiChat
          copilotId={process.env.NEXT_PUBLIC_LIVEBLOCKS_COPILOT_ID}
          className="h-full"
          tools={{
            get_accounts: {
              description: "Get all user accounts with balances and transaction counts",
              parameters: {},
              handler: () => handleToolCall("get_accounts"),
            },
            get_transactions: {
              description: "Get transactions for a specific account",
              parameters: {
                accountId: { type: "string", description: "Account ID" },
                limit: { type: "number", description: "Number of transactions to fetch", default: 10 },
              },
              handler: (params) => handleToolCall("get_transactions", params),
            },
            analyze_spending: {
              description: "Analyze user's overall spending and account summary",
              parameters: {},
              handler: () => handleToolCall("analyze_spending"),
            },
            get_financial_summary: {
              description: "Get comprehensive financial summary including recent transactions and category spending",
              parameters: {},
              handler: () => handleToolCall("get_financial_summary"),
            },
            get_category_transactions: {
              description: "Get transactions filtered by category",
              parameters: {
                category: { type: "string", description: "Transaction category" },
                limit: { type: "number", description: "Number of transactions", default: 10 },
              },
              handler: (params) => handleToolCall("get_category_transactions", params),
            },
          }}
          placeholder="Ask me about your finances, spending patterns, accounts, or specific transactions..."
        />
      </div>
    </div>
  );
}

export function AiChatDashboard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl h-[600px] mx-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">
                💬 AI Financial Assistant
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              <ClientSideSuspense fallback={<div>Loading AI chat...</div>}>
                <AiChatInterface />
              </ClientSideSuspense>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}