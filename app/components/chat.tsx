"use client";

import React, { useState, useEffect, useRef } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import { Brain, Check, Copy, FileIcon, LoaderIcon, PlusIcon, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Assistant, AssistantStreamEvent } from "openai/resources/beta/assistants";
import { Message as OpenAIMessage, MessagesPage } from "openai/resources/beta/threads/messages";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type MessageProps = {
  role: "user" | "assistant" | "code";
  text: string;
};

const UserMessage = ({ text }: { text: string }) => (
  <div className="flex items-start gap-4 justify-end">
    <div className="grid gap-2 bg-primary rounded-lg p-4 max-w-[80%] text-primary-foreground">
      <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
      <div className="text-xs text-primary-foreground/80">2:41 PM</div>
    </div>
    <UserRound className="text-zinc-700 mt-4" />
  </div>
);

const AssistantMessage = ({ text }: { text: string }) => (
  <div className="flex items-start gap-4">
    <Brain className="text-zinc-700 mt-4" />
    <div className="grid gap-2 bg-muted rounded-lg p-4 max-w-[80%] ml-10">
      <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
      <div className="text-xs text-muted-foreground">2:43 PM</div>
    </div>
  </div>
);

const CodeMessage = ({ text }: { text: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex items-start gap-4">
      <Brain className="text-zinc-700" />
      <div className="grid gap-2 bg-muted rounded-lg p-4 max-w-[80%] ml-10">
        <div className="bg-zinc-900 rounded-md p-4 overflow-x-auto relative">
          <pre className="text-sm text-zinc-100 font-mono">{text}</pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1 rounded-md bg-zinc-700 hover:bg-zinc-600 transition-colors"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-zinc-300" />
            )}
          </button>
        </div>
        <div className="text-xs text-muted-foreground">2:43 PM</div>
      </div>
    </div>
  );
};

const TypingMessage = () => (
  <div className="flex items-start gap-4">
    <Brain className="text-zinc-700" />
    <div className="grid gap-2 bg-muted rounded-lg p-4 max-w-[80%] ml-10">
      <LoaderIcon className="animate-spin" />
      <div className="text-xs text-muted-foreground">2:43 PM</div>
    </div>
  </div>
);

const Message = ({ role, text }: MessageProps) => {
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

type ChatProps = {
  functionCallHandler?: (
    toolCall: RequiredActionFunctionToolCall
  ) => Promise<string>;
  assistantId?: string;
  threadId?: string;
};

const Chat = ({
  functionCallHandler = () => Promise.resolve(""),
  assistantId,
  threadId,
}: ChatProps) => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [chatThreadId, setChatThreadId] = useState(threadId ?? "");
  const [runInProgress, setRunInProgress] = useState(false);
  const [assistant, setAssistant] = useState<Assistant>(null);
  const [files, setFiles] = useState([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchAssistant = async () => {
    const res = await fetch(`/api/assistants/${assistantId}`);
    const data = await res.json();
    console.log(data);
    setAssistant(data);
  };

  const fetchThreadFiles = async () => {
    const res = await fetch(`/api/assistants/${assistantId}/files/${threadId}`);
    const data = await res.json();
    console.log(data);
    setFiles(data);
  };

  useEffect(() => {
    scrollToBottom();
    fetchAssistant();
    let msg = {
      role: 'assistant',
      text: 'Hello, how can I help you?'
    }
    scrollToBottom();
  }, []);

  useEffect(() => {
    if (!chatThreadId) {
      const createThread = async () => {
        const res = await fetch(`/api/assistants/${assistantId}/threads/${threadId}/messages`, {
          method: "POST",
        });
        const data = await res.json();
        setChatThreadId(data.threadId);
      };
      createThread();
    }
    else {
      const fetchMessages = async () => {
        const res = await fetch(`/api/assistants/${assistantId}/threads/${threadId}/messages`);
        const msgs = await res.json() as MessagesPage;

        console.log(msgs.data);
        const messagesInReverse = msgs.data.map((msg: OpenAIMessage) => {
          const content = msg.content[0];
          return {
            role: msg.role,
            text: 'text' in content ? content.text.value : 'Image content'
          };
        }).reverse();
        setMessages(messagesInReverse);
      };
      fetchMessages();
      fetchThreadFiles();
    }
  }, []);

  const sendMessage = async (text) => {
    const response = await fetch(
      `/api/assistants/${assistantId}/threads/${threadId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          message: text,
          threadId: chatThreadId,
          assistantId: assistantId,
        }),
      }
    );
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  const submitActionResult = async (runId, toolCallOutputs) => {
    const response = await fetch(
      `/api/assistants/${assistantId}/threads/${threadId}/actions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runId: runId,
          toolCallOutputs: toolCallOutputs,
        }),
      }
    );
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendMessage(userInput);
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", text: userInput },
    ]);
    setUserInput("");
    setInputDisabled(true);
    scrollToBottom();
  };

  const handleTextCreated = () => {
    appendMessage("assistant", "");
  };

  const handleTextDelta = (delta) => {
    if (delta.value != null) {
      appendToLastMessage(delta.value);
    }
    if (delta.annotations != null) {
      annotateLastMessage(delta.annotations);
    }
  };

  const handleImageFileDone = (image) => {
    appendToLastMessage(`\n hello : ![${image.file_id}](/api/files/${image.file_id})\n`);
  };

  const toolCallCreated = (toolCall) => {
    if (toolCall.type != "code_interpreter") return;
    appendMessage("code", "");
  };

  const toolCallDelta = (delta, snapshot) => {
    console.log('tool call delta')
    if (delta.type != "code_interpreter") return;
    if (!delta.code_interpreter.input) return;

    console.log(delta.code_interpreter.input);
    console.log(delta.type);

    appendToLastMessage(delta.code_interpreter.input);
  };

  const handleRequiresAction = async (
    event: AssistantStreamEvent.ThreadRunRequiresAction
  ) => {
    const runId = event.data.id;
    const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
    const toolCallOutputs = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const result = await functionCallHandler(toolCall);
        return { output: result, tool_call_id: toolCall.id };
      })
    );
    setInputDisabled(true);
    submitActionResult(runId, toolCallOutputs);
  };

  async function handleMessageDone(event): Promise<void> {
    console.log('handleMessageDone', event);



  }

  const handleRunCompleted = () => {
    setInputDisabled(false);
  };

  const handleReadableStream = (stream: AssistantStream) => {

    console.log("handleReadableStream");
    console.log(stream);
    stream.on("textCreated", handleTextCreated);
    stream.on("textDelta", handleTextDelta);
    stream.on("imageFileDone", handleImageFileDone);
    stream.on("toolCallCreated", toolCallCreated);
    stream.on("toolCallDelta", toolCallDelta);
    stream.on("messageDone", handleMessageDone);
    stream.on("event", (event) => {
      const eventType = event.event;
      switch (eventType) {
        case "thread.run.requires_action":
          handleRequiresAction(event);
          break;
        case "thread.run.completed":
          handleRunCompleted();
          setRunInProgress(false);
          break;
        case "thread.message.in_progress":
          break;
        case "thread.message.completed":
          break;
        case "thread.run.created":
        case "thread.run.in_progress":
          setRunInProgress(true);
          break;
        default:
          break;
      }
    });
  };

  const appendToLastMessage = (text) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
        text: lastMessage.text + text,
      };
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  const appendMessage = (role, text) => {
    setMessages((prevMessages) => [...prevMessages, { role, text }]);
  };

  const annotateLastMessage = (annotations) => {

    console.log('annotateLastMessage', annotations);
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
      };
      annotations.forEach((annotation) => {
        if (annotation.type === 'file_path') {
          updatedLastMessage.text = updatedLastMessage.text.replaceAll(
            annotation.text,
            `/api/files/${annotation.file_path.file_id}`
          );
        }
      });
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChatFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {

    console.log('handleFileUpload');
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {

      const response = await fetch(`/api/assistants/${assistantId}/files/${threadId}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log('upload response', data);

      if (response.ok) {

        
        setFiles(prevFiles => [...prevFiles, data]);
      }
      // Handle the response data as needed
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleFileDelete = async (fileId) => {
    await fetch(`/api/assistants/${assistantId}/files`, {
      method: "DELETE",
      body: JSON.stringify({ fileId }),
    });
  };

  const removeFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/assistants/${assistantId}/files/${threadId}`, {
        method: "DELETE",
        body: JSON.stringify({ fileId }),
      });
      if (response.ok) {
        setFiles(files.filter(file => file.file_id !== fileId));
      } else {
        console.error('Failed to remove file');
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="bg-card border-b border-muted px-6 py-4 flex-shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">
              {assistant?.name}
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Thread ID:</span>
              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                {threadId || "N/A"}
              </code>
            </div>
          </div>
          <div className="mt-4 flex space-x-4">
            <div className="w-1/2">
              <Accordion type="single" collapsible>
                <AccordionItem value="description">
                  <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground">
                    Assistant Description
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      {assistant?.instructions || "No description available."}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div className="w-1/2">
              <Accordion type="single" collapsible>
                <AccordionItem value="tools">
                  <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground">
                    Assistant Tools
                  </AccordionTrigger>
                  <AccordionContent>
                    {assistant?.tools?.length > 0 ? (
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {assistant.tools.map((tool, index) => (
                          <li key={index}>{tool.type}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tools available.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-4">
            {messages.map((msg, index) => (
              <Message key={index} role={msg.role} text={msg.text} />
            ))}
            {runInProgress && <TypingMessage />}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="bg-card border-t border-muted px-6 py-4 flex-shrink-0">
          <h3 className="text-sm font-semibold text-foreground mb-2">Attached Files</h3>
          {files.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span id={`file-${file.file_id}`} className="text-sm text-muted-foreground truncate">{file.filename}</span>
                  </div>
                  <Trash2
                    className="h-4 w-4 text-red-500 hover:text-red-700 cursor-pointer"
                    onClick={() => removeFile(file.file_id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No files attached.</p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex-shrink-0">
          <div className="bg-card border-t border-muted px-6 py-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="mr-2" disabled={inputDisabled} onClick={() => document.getElementById('file-upload').click()}>
                <PlusIcon className="w-5 h-5" />
                <span className="sr-only">Attach file</span>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleChatFileUpload}
                  aria-label="Attach files"
                />
              </Button>
              <Input
                type="text"
                placeholder="Type your message..."
                className="flex-1 rounded-full"
                value={userInput}
                disabled={inputDisabled}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button type="submit" disabled={inputDisabled}>Send</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
    
  );
};

export default Chat;

