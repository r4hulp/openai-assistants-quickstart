"use client"
import  { useRouter } from 'next/navigation'
import { useState } from 'react';
export default function ChatPage({ params }) {
    
    const router = useRouter();
    const [threadId, setThreadId] = useState("");
    const createThread = async () => {
        const res = await fetch(`/api/assistants/threads`, {
          method: "POST",
        });
        const data = await res.json();
        setThreadId(data.threadId);
        console.log(data.threadId)
        router.push(`/chat/${data.threadId}`)
      };

      

    return (
        <main>
            <button onClick={async () => { await createThread()}}>Create a new thread</button>
        </main>
    );
}