"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

const serializeTransaction = (obj) => {
    const serialized = { ...obj };
    if (obj.balance) {
        serialized.balance = obj.balance.toNumber();
    }
    if (obj.amount) {
        serialized.amount = obj.amount.toNumber();
    }
    return serialized;
};

export async function getFinancialSummary() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error("User not found");

        // Get accounts with transaction counts
        const accounts = await db.account.findMany({
            where: { userId: user.id },
            include: {
                _count: {
                    select: { transactions: true }
                },
                transactions: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                }
            }
        });

        // Get recent transactions across all accounts
        const recentTransactions = await db.transaction.findMany({
            where: { userId: user.id },
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
                account: {
                    select: { name: true, type: true }
                }
            }
        });

        // Calculate totals
        const totalBalance = accounts.reduce((sum, account) => 
            sum + parseFloat(account.balance), 0
        );

        const totalTransactions = accounts.reduce((sum, account) => 
            sum + account._count.transactions, 0
        );

        // Get spending by category (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const categorySpending = await db.transaction.groupBy({
            by: ['category'],
            where: {
                userId: user.id,
                type: 'EXPENSE',
                date: {
                    gte: thirtyDaysAgo
                }
            },
            _sum: {
                amount: true
            }
        });

        return {
            success: true,
            data: {
                accounts: accounts.map(serializeTransaction),
                recentTransactions: recentTransactions.map(serializeTransaction),
                summary: {
                    totalBalance,
                    totalTransactions,
                    accountCount: accounts.length,
                    categorySpending: categorySpending.map(cat => ({
                        category: cat.category,
                        amount: cat._sum.amount?.toNumber() || 0
                    }))
                }
            }
        };
    } catch (error) {
        console.error("Financial summary error:", error);
        return { success: false, error: error.message };
    }
}

export async function getTransactionsByCategory(category, limit = 10) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error("User not found");

        const transactions = await db.transaction.findMany({
            where: {
                userId: user.id,
                category: category
            },
            take: limit,
            orderBy: { date: "desc" },
            include: {
                account: {
                    select: { name: true, type: true }
                }
            }
        });

        return {
            success: true,
            data: transactions.map(serializeTransaction)
        };
    } catch (error) {
        console.error("Category transactions error:", error);
        return { success: false, error: error.message };
    }
}