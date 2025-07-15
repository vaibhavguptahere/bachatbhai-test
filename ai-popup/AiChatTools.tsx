import React from "react";
import { Badge } from "@/components/Badge";
import { transactions } from "@/data/transactions";
import { format } from "date-fns";
import {
  expense_statuses,
  payment_statuses,
  locations,
  currencies,
  categories,
  merchants,
} from "@/data/schema";
import { users } from "@/data/users";
import Image from "next/image";
import { defineAiTool } from "@liveblocks/client";
import { useRouter } from "next/navigation";
import { AiTool } from "@liveblocks/react-ui";
import { Timestamp } from "@liveblocks/react-ui/primitives";
import { toast } from "sonner";
import { RegisterAiTool } from "@liveblocks/react";
import { ChevronDownIcon } from "lucide-react";
import { formatters } from "@/lib/utils";
import { getUserAccounts } from "@/actions/dashboard";
import { getAccountWithTransactions } from "@/actions/account";
import { getFinancialSummary } from "@/actions/ai-data";
import { ProgressBar } from "../components/ProgressBar";

// Tool to show user's account balances and information
export function UserAccountsTool() {
  return (
    <RegisterAiTool
      name="user-accounts"
      tool={defineAiTool()({
        description: "Show user's accounts with balances and transaction counts",
        parameters: {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
        execute: async () => {
          const accounts = await getUserAccounts();
          return {
            data: { accounts },
          };
        },
        render: ({ args }) =>
          args ? <AiTool title="User Accounts" /> : null,
      })}
    />
  );
}

// Tool to analyze user's spending patterns
export function SpendingAnalysisTool() {
  return (
    <RegisterAiTool
      name="spending-analysis"
      tool={defineAiTool()({
        description: "Analyze user's spending patterns and financial summary",
        parameters: {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
        execute: async () => {
          const summary = await getFinancialSummary();
          return {
            data: summary.data,
          };
        },
        render: ({ args }) =>
          args ? <AiTool title="Spending Analysis" /> : null,
      })}
    />
  );
}

// Tool to get transactions for a specific account
export function AccountTransactionsTool() {
  return (
    <RegisterAiTool
      name="account-transactions"
      tool={defineAiTool()({
        description: "Get transactions for a specific account by account ID",
        parameters: {
          type: "object",
          properties: {
            accountId: { type: "string" },
            limit: { type: "number" },
          },
          required: ["accountId"],
          additionalProperties: false,
        },
        execute: async (args) => {
          const accountData = await getAccountWithTransactions(args.accountId);
          const transactions = accountData?.transactions.slice(0, args.limit || 10) || [];
          return {
            data: {
              account: accountData ? {
                name: accountData.name,
                type: accountData.type,
                balance: accountData.balance
              } : null,
              transactions
            },
          };
        },
        render: ({ args }) =>
          args ? <AiTool title={`Account Transactions`} /> : null,
      })}
    />
  );
}

// Shows a bar highlighting the remaining seats, along with text
export function SeatsTool() {
  return (
    <RegisterAiTool
      name="seats"
      tool={defineAiTool()({
        description:
          "Show a visual of the remaining seats. Place in the current seat limit and seats used.",
        parameters: {
          type: "object",
          properties: {
            seatsLimit: { type: "number" },
            seatsUsed: { type: "number" },
          },
          required: ["seatsLimit", "seatsUsed"],
          additionalProperties: false,
        },
        execute: () => {},
        render: ({ args }) => {
          if (!args) return null;

          return (
            <div className="rounded-lg bg-neutral-100 p-4 pt-4.5 dark:bg-neutral-900">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                Remaining seats
              </p>
              <ProgressBar
                value={(args.seatsUsed / args.seatsLimit) * 100 || 0}
                className="mt-2"
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="flex items-center space-x-2">
                  <span className="rounded-lg bg-neutral-200 px-2 py-1 text-xs font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50">
                    {args.seatsUsed}
                  </span>{" "}
                  <span className="text-sm text-neutral-500 dark:text-neutral-500">
                    of {args.seatsLimit} seats used
                  </span>
                </p>
              </div>
            </div>
          );
        },
      })}
    />
  );
}

// Allows the AI to navigate to a page, showing a toast notification as it does it
export function NavigateToPageTool() {
  const router = useRouter();

  return (
    <RegisterAiTool
      name="navigate-to-page"
      tool={defineAiTool()({
        description:
          "Redirect the user to a page. Only navigate if the user has directly asked you to do it. Never assume they want to. Just say you've found the page, or you can't find it, then do it.",
        parameters: {
          type: "object",
          properties: {
            relativeUrl: { type: "string" },
          },
          additionalProperties: false,
          required: ["relativeUrl"],
        },
        execute: ({ relativeUrl }) => {
          router.push(relativeUrl);
          toast(`Redirecting to ${relativeUrl}...`, {
            action: {
              label: "Go back",
              onClick: () => router.back(),
            },
          });
          return {
            description:
              "Redirected the user to the page. Do not write anything else.",
            data: {},
          };
        },
        render: ({ args }) =>
          args ? <AiTool title={`Redirected to ${args.relativeUrl}`} /> : null,
      })}
    />
  );
}

// Tool to display account information in a card format
export function AccountDisplayTool() {
  return (
    <RegisterAiTool
      name="display-account"
      tool={defineAiTool()({
        description: "Display account information in a formatted card",
        parameters: {
          type: "object",
          properties: {
            accountId: { type: "string" },
            accountName: { type: "string" },
            accountType: { type: "string" },
            balance: { type: "number" },
            isDefault: { type: "boolean" },
          },
          required: ["accountId", "accountName", "accountType", "balance"],
          additionalProperties: false,
        },
        render: ({ args, respond }) => {
          if (!args) return null;
          respond();

          return (
            <div className="my-2 w-full rounded-sm bg-neutral-100 dark:bg-neutral-900 px-4 pt-3.5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 font-semibold">
                  {args.accountName}
                  {args.isDefault && (
                    <Badge variant="default" className="ml-2 text-xs">Default</Badge>
                  )}
                </div>
                <Badge variant="outline">{args.accountType}</Badge>
              </div>
              <div className="mt-2 text-lg font-bold text-green-600">
                Rs {args.balance.toFixed(2)}
              </div>
            </div>
          );
        },
      })}
    />
  );
}

// Tool to display transaction information
export function TransactionDisplayTool() {
  return (
    <RegisterAiTool
      name="display-transaction"
      tool={defineAiTool()({
        description: "Display transaction information in a formatted card",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string" },
            amount: { type: "number" },
            description: { type: "string" },
            category: { type: "string" },
            date: { type: "string" },
            status: { type: "string" },
          },
          required: ["id", "type", "amount", "description", "category", "date"],
          additionalProperties: false,
        },
        render: ({ args, respond }) => {
          if (!args) return null;
          respond();

          return (
            <div className="my-2 w-full rounded-sm bg-neutral-100 dark:bg-neutral-900 px-4 pt-3.5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 font-semibold">
                  {args.description}
                </div>
                <Badge variant={args.type === 'INCOME' ? 'default' : 'destructive'}>
                  {args.type}
                </Badge>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-neutral-600 capitalize">
                  {args.category}
                </span>
                <span className={`font-bold ${args.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                  {args.type === 'INCOME' ? '+' : '-'}Rs {args.amount.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {new Date(args.date).toLocaleDateString()}
              </div>
            </div>
          );
        },
      })}
    />
  );
}

// Create account tool
export function CreateAccountTool() {
  return (
    <RegisterAiTool
      name="create-account"
      tool={defineAiTool()({
        description: "Help user create a new account by providing a link to the account creation form",
        parameters: {
          type: "object",
          properties: {},
          additionalProperties: false,
          required: [],
        },
        render: ({ args, respond }) => {
          if (!args) return null;
          respond();
          return (
            <div className="my-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You can create a new account by clicking the "Add New Account" card on your dashboard, or I can navigate you there.
              </p>
            </div>
          );
        },
      })}
    />
  );
}

// Allows the AI to display the details of a transaction
export function TransactionToolAi() {
  return (
    <RegisterAiTool
      name="transaction"
      tool={defineAiTool()({
        description: "Display the transaction details",
        parameters: {
          type: "object",
          properties: {
            transactionId: { type: "string" },
          },
          additionalProperties: false,
          required: ["transactionId"],
        },
        render: ({ args, respond }) => {
          if (!args) return null;
          respond();
          return <TransactionToolUi transactionId={args.transactionId} />;
        },
      })}
    />
  );
}

// Allows the AI to display the avatar and name of a team member
export function MemberToolAi() {
  return (
    <RegisterAiTool
      name="member"
      tool={defineAiTool()({
        description: "Display the member details",
        parameters: {
          type: "object",
          properties: {
            email: { type: "string" },
          },
          additionalProperties: false,
          required: ["email"],
        },
        render: ({ args, respond }) => {
          if (!args) return null;
          respond();
          return <MemberTool email={args.email} />;
        },
      })}
    />
  );
}

function TransactionToolUi({ transactionId }: { transactionId: string }) {
  const transaction = transactions.find(
    (transaction) => transaction.transaction_id === transactionId
  );

  if (!transaction) {
    return <div>Transaction not found</div>;
  }

  const status = expense_statuses.find(
    (item) => item.value === transaction.expense_status
  );

  return (
    <div className="my-2 w-full rounded-sm bg-neutral-100 dark:bg-neutral-900 px-4 pt-3.5 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 font-semibold">
          {transaction.merchant}{" "}
          <a href="#">
            <svg
              className="h-4 w-4 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </a>
        </div>
        <Badge variant={status?.variant as any}>{status?.label}</Badge>
      </div>

      <div className="mt-0.5 flex items-center gap-1.5 text-xs">
        {format(transaction.transaction_date, "MMM d yyyy")}, $
        {transaction.amount.toLocaleString()}
      </div>
    </div>
  );
}

function MemberTool({ email }: { email: string }) {
  const user = users.find((user) => user.email === email);

  if (!user) {
    return null;
  }

  return (
    <div className="my-2 flex items-center gap-2 rounded-sm bg-neutral-100 p-4">
      <Image
        src={user.avatar}
        alt={`${user.name}'s avatar`}
        width={36}
        height={36}
        className="size-9 rounded-full border border-neutral-300 object-cover dark:border-neutral-700"
      />
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          {user?.name}
        </p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          {user?.email}
        </p>
      </div>
    </div>
  );
}
