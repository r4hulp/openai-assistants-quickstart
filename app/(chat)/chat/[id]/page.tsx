'use client';

import { useEffect, useState } from "react";

import { AI, ClientMessage } from "./actions";
import { useActions, useUIState } from "ai/rsc";
import { Message, useAssistant } from 'ai/react'
import Markdown from "react-markdown";


export interface ChatPageProps {
  params: {
    id: string
  }
}

const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div >
      <Markdown>{text}</Markdown>
    </div>
  );
};

export default function ChatPage({ params }: ChatPageProps) {

  const { status, messages, input, submitMessage, handleInputChange, } = useAssistant({
    api: `/api/assistants/threads/${params.id}/messages`,


  });

  useEffect(() => {
    console.log(messages);
  }, [messages])

  return (
    <div className="flex flex-col gap-2">
      <div className="p-2">status: {status}</div>

      <div className="flex flex-col p-2 gap-2">
        {messages.map((message: Message) => (
          <div key={message.id} className="flex flex-row gap-2">
            <div className="w-24 text-zinc-500">{`${message.role}: `}</div>

            {
              message.content && <div>
                {message.role === 'assistant' ? <AssistantMessage text={message.content} /> : <div className="w-full">{message.content}</div>}
              </div>
            }
            { message.data && message.data.type === 'image' && <img src={message.data.url}
          </div>
        ))}
      </div>

      <form onSubmit={submitMessage} className="fixed bottom-0 p-2 w-full">
        <input
          className="bg-zinc-100 w-full p-2"
          placeholder="Send message..."
          value={input}
          onChange={handleInputChange}
          disabled={status !== 'awaiting_message'}
        />
      </form>
    </div>
  )
}