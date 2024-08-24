'use client';

import { StreamableValue, useStreamableValue } from 'ai/rsc';
import { useEffect } from 'react';
import Markdown from 'react-markdown';

type MessageProps = {
  role: "user" | "assistant" | "code";
  text: string;
};

const UserMessage = ({ text }: { text: string }) => {
  return <div >{text}</div>;
};

const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div>
      <Markdown>{text}</Markdown>
    </div>
  );
};

const CodeMessage = ({ text }: { text: string }) => {
  return (
    <div>
      {text.split("\n").map((line, index) => (
        <div key={index}>
          <span>{`${index + 1}. `}</span>
          {line}
        </div>
      ))}
    </div>
  );
};

const TextMessage = ({ role, text }: MessageProps) => {
  switch (role) {
    case "user":
      return <UserMessage text={text} />;
    case "assistant":
      return <AssistantMessage text={text} />;
    case "code":
      return <CodeMessage text={text} />;
    default:
      return null;
  }
};

export function Message({ textStream }: { textStream: StreamableValue }) {
  const [text] = useStreamableValue(textStream);

  useEffect(() => {
    console.log("Message updated", textStream);
  }, [textStream]);
  return <Markdown>{text}</Markdown>;
}