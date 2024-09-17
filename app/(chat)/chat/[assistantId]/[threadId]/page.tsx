'use client';
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";
import Chat2 from "@/app/components/chat2";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle } from "lucide-react";

export interface ChatPageProps {
  params: {
    threadId: string
    assistantId: string
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  const chatHistory = [
    { id: 1, title: "Project brainstorming", date: "2 days ago" },
    { id: 2, title: "Code review discussion", date: "Yesterday" },
    { id: 3, title: "Bug fixing session", date: "Today" },
    { id: 4, title: "Feature planning", date: "Just now" },
    { id: 5, title: "Project brainstorming", date: "2 days ago" },
    { id: 6, title: "Code review discussion", date: "Yesterday" },
    { id: 7, title: "Bug fixing session", date: "Today" },
    { id: 8, title: "Feature planning", date: "Just now" },
    { id: 9, title: "Project brainstorming", date: "2 days ago" },
    { id: 10, title: "Code review discussion", date: "Yesterday" },
    { id: 11, title: "Bug fixing session", date: "Today" },
    { id: 12, title: "Feature planning", date: "Just now" },
    { id: 13, title: "Project brainstorming", date: "2 days ago" },
    { id: 14, title: "Code review discussion", date: "Yesterday" },
    { id: 15, title: "Bug fixing session", date: "Today" },
    { id: 16, title: "Feature planning", date: "Just now" },
    { id: 17, title: "Project brainstorming", date: "2 days ago" },
    { id: 18, title: "Code review discussion", date: "Yesterday" },
    { id: 19, title: "Bug fixing session", date: "Today" },
    { id: 20, title: "Feature planning", date: "Just now" },

  ];

  const ChatHistoryList = () => (
    <ScrollArea className="h-[calc(100vh-16vh)]">
      <div className="space-y-2 p-2">
        {chatHistory.map((chat) => (
          <Button
            key={chat.id}
            variant="ghost"
            className="w-full justify-start text-left font-normal"
          >
            <div className="flex flex-col">
              <span className="font-medium">{chat.title}</span>
              <span className="text-xs text-muted-foreground">{chat.date}</span>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <div className="flex h-[calc(100vh-8vh)] flex-col items-center justify-center  gap-4">
      <div className="flex flex-col md:flex-row w-full h-full">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden mb-4 w-10 h-10 px-0">
              <MenuIcon className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <SheetHeader>
              <SheetTitle>Recent Threads</SheetTitle>
            </SheetHeader>
            <ChatHistoryList />
          </SheetContent>
        </Sheet>
        <aside className="hidden md:block w-1/4 border-r">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Recent Threads</h2>
            <ChatHistoryList />
          </div>
        </aside>
        <div className="z-10 border  w-full h-full text-sm flex">
          <Chat2 assistantId={params.assistantId} threadId={params.threadId} />

        </div>
      </div>
    </div>
  )
}