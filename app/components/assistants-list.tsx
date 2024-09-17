"use client"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation";
import { Assistant } from "openai/resources/beta/assistants";
import { useState, useEffect } from "react";

interface AssistantsListProps {
  userId: string; // user id
}

export default function AssistantsList({ userId }: AssistantsListProps) {

  const router = useRouter();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const createThread = async (assistantId: string) => {
    const res = await fetch(`/api/assistants/threads`, {
      method: "POST",
      body: JSON.stringify({
        assistantId: assistantId
      }),
    });
    const data = await res.json();

    const pushThreadToTable = async () => {
      console.log('pushing thread to table', data.threadId, userId);
      const res = await fetch(`/api/db/table`, {
        method: "POST",
        body: JSON.stringify({
          assistantId: assistantId,
          threadId: data.threadId,
          userId: userId
        }),
      });
    }

    pushThreadToTable().then(() => {
      router.push(`/chat/${assistantId}/${data.threadId}`)
    })
  };

  // create a new threadID when chat component created
  useEffect(() => {
    const getAssistants = async () => {
      const res = await fetch(`/api/assistants/list`, {
        method: "GET",
      });
      const data = await res.json() as Assistant[];
      setAssistants(data);
    };

    getAssistants();
  }, []);


  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-6xl mx-auto p-4">
      {assistants.map((assistant) => (
        <Card className="h-full flex flex-col" key={assistant.id}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{assistant.name}</CardTitle>
            <CardDescription>{assistant.description}</CardDescription>
          </CardHeader>
          <div className="flex-1" />
          <CardContent>
            <Button className="w-full" onClick={() => { createThread(assistant.id) }}>Chat</Button>
          </CardContent>
        </Card>
      ))
      }
    </div>
  )
}