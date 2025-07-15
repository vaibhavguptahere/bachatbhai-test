"use client";

import { LiveblocksProvider as Provider } from "@liveblocks/react/suspense";

export function LiveblocksProvider({ children }) {
  return (
    <Provider
      authEndpoint="/api/liveblocks-auth"
      publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY}
    >
      {children}
    </Provider>
  );
}