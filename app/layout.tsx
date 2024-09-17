import { Inter as FontSans } from "next/font/google"
import "./globals.css";
import Warnings from "./components/warnings";
import { assistantId } from "./assistant-config";
import { cn } from "@/lib/utils";
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata = {
  title: "Assistants",
  description: "Chat with AI",
  icons: {
    icon: "/openai.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {assistantId ? children : <Warnings />}
      </body>
    </html>
  );
}
