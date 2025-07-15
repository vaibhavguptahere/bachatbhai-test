import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserAccounts } from "@/actions/dashboard";
import { getAccountWithTransactions } from "@/actions/account";
import { getFinancialSummary, getTransactionsByCategory } from "@/actions/ai-data";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tool, parameters } = await req.json();

    switch (tool) {
      case "get_user_accounts":
        const accounts = await getUserAccounts();
        return NextResponse.json({
          success: true,
          data: accounts,
          description: `Found ${accounts.length} accounts for the user.`
        });

      case "get_account_transactions":
        const { accountId, limit = 10 } = parameters;
        const accountData = await getAccountWithTransactions(accountId);
        
        if (!accountData) {
          return NextResponse.json({
            success: false,
            error: "Account not found"
          });
        }

        const transactions = accountData.transactions.slice(0, limit);
        return NextResponse.json({
          success: true,
          data: {
            account: {
              name: accountData.name,
              type: accountData.type,
              balance: accountData.balance
            },
            transactions: transactions.map(tx => ({
              id: tx.id,
              type: tx.type,
              amount: tx.amount,
              description: tx.description,
              category: tx.category,
              date: tx.date,
              status: tx.status
            }))
          },
          description: `Retrieved ${transactions.length} transactions for account ${accountData.name}.`
        });

      case "analyze_spending":
        const userAccounts = await getUserAccounts();
        let totalBalance = 0;
        let totalTransactions = 0;
        
        for (const account of userAccounts) {
          totalBalance += parseFloat(account.balance);
          totalTransactions += account._count?.transactions || 0;
        }

        return NextResponse.json({
          success: true,
          data: {
            totalBalance,
            totalTransactions,
            accountCount: userAccounts.length,
            accounts: userAccounts.map(acc => ({
              name: acc.name,
              type: acc.type,
              balance: acc.balance,
              isDefault: acc.isDefault
            }))
          },
          description: `User has ${userAccounts.length} accounts with a total balance of Rs ${totalBalance.toFixed(2)} and ${totalTransactions} total transactions.`
        });

      case "get_financial_summary":
        const summary = await getFinancialSummary();
        return NextResponse.json(summary);

      case "get_category_transactions":
        const { category, limit: categoryLimit = 10 } = parameters;
        const categoryTxns = await getTransactionsByCategory(category, categoryLimit);
        return NextResponse.json(categoryTxns);

      default:
        return NextResponse.json({
          success: false,
          error: "Unknown tool"
        });
    }
  } catch (error) {
    console.error("AI Tools API Error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}