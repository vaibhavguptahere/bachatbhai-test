
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Toaster } from "@/components/ui/sonner"
import LenisProvider from "@/components/LenisProvider";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import { LiveblocksProvider } from "@/components/ai-chat/LiveblocksProvider";
import { AiChatRoom } from "@/components/ai-chat/AiChatRoom";

export const metadata = {
  title: "Bachat Bhai",
  description: "AI Powered Finance Tracker",
};
export default function RootLayout({ children }) {

  return (
    <>
      <ClerkProvider>
        <html lang="en">
          <body className={`${inter}`}>
            <LiveblocksProvider>
              <LenisProvider>
                <ScrollProgressBar />

                <Toaster expand={false} richColors closeButton />
                <Navbar />
                <div className="min-h-screen">
                  <AiChatRoom>
                    {children}
                  </AiChatRoom>
                </div>
                <Footer />
              </LenisProvider>
            </LiveblocksProvider>
          </body>
        </html>
      </ClerkProvider >
    </>
  )
}