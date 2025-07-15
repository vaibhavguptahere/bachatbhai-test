"use client";

import { RoomProvider } from "@liveblocks/react/suspense";
import { AiChatDashboard } from "./AiChatDashboard";

export function AiChatRoom({ children }) {
  return (
    <RoomProvider id="ai-chat-room" initialPresence={{}}>
      {children}
      <AiChatDashboard />
    </RoomProvider>
  );
}