import { liveblocks } from "@/lib/liveblocks";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Create a session for the current user
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: "User", // You can get this from Clerk user data
        email: "user@example.com", // You can get this from Clerk user data
      },
    });

    // Give the user access to the room
    session.allow("ai-chat-room", session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    return new Response(body, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}