import { useSendAiMessage } from "@liveblocks/react";
import { AiChatComponentsEmptyProps } from "@liveblocks/react-ui";

// Clickable suggestions in the placeholder
const SUGGESTIONS = [
  {
    text: "Show my accounts",
    prompt: "Show me all my accounts with their balances",
  },
  {
    text: "Analyze my spending",
    prompt: "Analyze my spending patterns and give me insights",
  },
  {
    text: "Recent transactions",
    prompt: "Show me my recent transactions",
  },
  {
    text: "Create new account",
    prompt: "Help me create a new account",
  },
  {
    text: "Go to dashboard",
    prompt: "Navigate to the dashboard",
  },
];

// Placeholder that's displayed when there's no messages in the chat
export function AiChatPlaceholder({ chatId }: AiChatComponentsEmptyProps) {
  const sendMessage = useSendAiMessage(chatId);

  return (
    <div className="flex h-full flex-col justify-end gap-5 p-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold tracking-[-0.01em]">
          How can I help you?
        </h3>
        <p className="text-balance text-neutral-500">
          Ask me anything about your finances, accounts, or transactions. I can help you analyze your spending and manage your money.
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-2">
        {SUGGESTIONS.map(({ text, prompt }) => (
          <button
            key={text}
            className="flex items-center gap-2 rounded-full border bg-white px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-out hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            onClick={() => sendMessage(prompt)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
