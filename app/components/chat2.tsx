"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import useChatStore from "@/hooks/useChatStore";
import { ChatBubble, ChatBubbleMessage } from "@/src/components/ui/chat/chat-bubble";
import { ChatInput } from "@/src/components/ui/chat/chat-input";
import { ChatMessageList } from "@/src/components/ui/chat/chat-message-list";

import { AnimatePresence, motion } from "framer-motion";
import {
  CopyIcon,
  CornerDownLeft,
  Mic,
  Paperclip,
  RefreshCcw,
  Volume2,
  Check,
  Copy,
  Info,
  RefreshCw,
  FileText,
  Trash2,
  Hash,
  MoreHorizontal,
  Settings,
  HelpCircle,
} from "lucide-react";
import { AssistantStream } from "openai/lib/AssistantStream";
import { Assistant, AssistantStreamEvent } from "openai/resources/beta/assistants";
import { Message as OpenAIMessage, MessagesPage } from "openai/resources/beta/threads/messages";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import a11yDark from 'react-syntax-highlighter/dist/cjs/styles/prism/a11y-dark';
import { getRunStep, listRunSteps } from "../actions/run";
import { getAssistant } from "../actions/assistant";
import { createThreadMessageWithFile, listMessages } from "../actions/message";
import { uploadFile, uploadFileToThread } from "../actions/files";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
const ChatAiIcons = [
  {
    icon: CopyIcon,
    label: "Copy",
  },
  {
    icon: RefreshCcw,
    label: "Refresh",
  },
  {
    icon: Volume2,
    label: "Volume",
  },
];

type MessageProps = {
  role: "user" | "assistant" | "code";
  text: string;
  runId: string;
  isLoading?: boolean;
};

type Chat2Props = {
  functionCallHandler?: (
    toolCall: RequiredActionFunctionToolCall
  ) => Promise<string>;
  assistantId: string;
  threadId: string;
}

export default function Chat2({ assistantId, threadId, functionCallHandler }: Chat2Props) {
  const [userInput, setUserInput] = useState("");
  const [inputDisabled, setInputDisabled] = useState(false);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [assistant, setAssistant] = useState<Assistant>(null);
  const [files, setFiles] = useState([]);
  const [chatThreadId, setChatThreadId] = useState(threadId ?? "");
  const [runInProgress, setRunInProgress] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [lastRunDetails, setLastRunDetails] = useState(null);
  const [lastRunId, setLastRunId] = useState(null);

  const selectedUser = useChatStore((state) => state.selectedUser);
  const input = useChatStore((state) => state.input);

  const setInput = useChatStore((state) => state.setInput);
  const handleInputChange = useChatStore((state) => state.handleInputChange);
  const hasInitialAIResponse = useChatStore(
    (state) => state.hasInitialAIResponse,
  );
  const setHasInitialAIResponse = useChatStore(
    (state) => state.setHasInitialAIResponse,
  );
  const [isLoading, setisLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const MarkdownComponents: object = {
    // SyntaxHighlight code will go here
  }

  const getMessageVariant = (role: string) =>
    role === "assistant" ? "received" : "sent";

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSendMessage(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const fetchAssistant = async () => {
    const assistantData = await getAssistant(assistantId);
    console.log(assistantData);
    setAssistant(assistantData);
  };

  const fetchThreadFiles = async () => {
    const res = await fetch(`/api/assistants/${assistantId}/files/${threadId}`);
    const data = await res.json();
    console.log(data);
    setFiles(data);
  };

  const fetchLastRunDetails = async () => {

    console.log(messages[messages.length - 1]);
    let runId = messages[messages.length - 1].runId;
    try {
      const response = await listRunSteps(threadId, runId);

      console.log(response[0]);
      setLastRunDetails(response);

      // fetch the last step of the run
      const lastStep = response[response.length - 1];
      const step = await getRunStep(threadId, runId, lastStep.id);
      setLastRunDetails(step);
    } catch (error) {
      console.error("Error fetching last run details:", error);
    }
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage(input);
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", text: input, runId: 'to-be-set' },
    ]);

    setInput("");
    setUserInput("");
    setInputDisabled(true);
    formRef.current?.reset();
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

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
        const msgs = await listMessages(threadId);

        const messagesInReverse = msgs.map((msg: OpenAIMessage) => {
          const content = msg.content[0];
          return {
            role: msg.role,
            text: 'text' in content ? content.text.value : 'Image content',
            runId: msg.run_id
          };
        }).reverse();

        // set the id of the last message as the last run id
        setLastRunId(messagesInReverse[0].runId);

        setMessages(messagesInReverse);
      };
      fetchMessages();
      fetchThreadFiles();
    }

    // Simulate AI response
    if (!hasInitialAIResponse) {
      setisLoading(true);
      setTimeout(() => {

        setisLoading(false);
        setHasInitialAIResponse(true);
      }, 2500);
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
      { role: "user", text: userInput, runId: lastRunId },
    ]);
    setUserInput("");
    setInputDisabled(true);
  };

  const handleTextCreated = () => {
    appendMessage("assistant", "", lastRunId);
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
    console.log('toolCallCreated', toolCall);
    if (toolCall.type != "code_interpreter") return;
    appendMessage("code", "", lastRunId);
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

  const handleRunCompleted = (event: AssistantStreamEvent.ThreadRunCompleted) => {
    console.log('handleRunCompleted', event.data.usage);
    setInputDisabled(false);
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage.isLoading) {
        return [...prevMessages.slice(0, -1), { ...lastMessage, isLoading: false }];
      }
      return prevMessages;
    });

    // add a message with the usage
    setMessages((prevMessages) => [...prevMessages, { role: "assistant", text: `Tokens used: ${event.data.usage.prompt_tokens} input, ${event.data.usage.completion_tokens} output`, runId: event.data.id }]);
  };

  const handleReadableStream = (stream: AssistantStream) => {
    console.log("handleReadableStream", stream);
    stream.on("runStepCreated", (event) => {
      setLastRunId(event.id);
      // set this run Id for the last message 
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        return [...prevMessages.slice(0, -1), { ...lastMessage, runId: event.id }];
      });

      console.log("runStepCreated", event);
    });
    stream.on("runStepDelta", (event) => {
      console.log("runStepDelta", event);
    });
    stream.on("runStepDone", (event) => {
      console.log("runStepCompleted", event);
    });
    stream.on("textCreated", handleTextCreated);
    stream.on("textDelta", handleTextDelta);
    stream.on("imageFileDone", handleImageFileDone);
    stream.on("toolCallCreated", toolCallCreated);
    stream.on("toolCallDelta", toolCallDelta);
    stream.on("messageCreated", (event) => {
      console.log("messageCreated", event);
    });
    stream.on("messageDone", handleMessageDone);
    stream.on("event", (event) => {
      const eventType = event.event;
      console.log("eventType", eventType);
      switch (eventType) {
        case "thread.run.requires_action":
          handleRequiresAction(event);
          break;
        case "thread.run.completed":
          handleRunCompleted(event);
          setRunInProgress(false);
          break;
        case "thread.message.in_progress":
          break;
        case "thread.message.completed":
          break;
        case "thread.run.created":
          setRunInProgress(true);
          break;
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

  const appendMessage = (role, text, runId) => {
    setMessages((prevMessages) => [...prevMessages, { role, text, runId }]);
  };

  const annotateLastMessage = (annotations) => {
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

  const handleChatFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  return (
    <div className="h-full w-full">
      <div className="relative flex h-full flex-col rounded-xl bg-muted/20 dark:bg-muted/40  lg:col-span-2">
        
        <div className="sticky border-b top-0 z-10 py-5 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <nav className="flex items-center justify-between ">
            <div className="flex items-center space-x-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Hash className="size-4" />
                    Thread ID
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="flex items-center justify-between">
                    <code className="text-sm">{threadId}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(threadId)}
                    >
                      {copiedCode === threadId ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5" >
                    <FileText className="size-4" />
                    Files ({files.length})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    {files.length > 0 ? (
                      files.map((file) => (
                        <div key={file.file_id} className="flex items-center justify-between">
                          <span className="truncate">{file.filename}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.file_id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">No files uploaded</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('fileInput')?.click()}
                        >
                          <Paperclip className="size-4 mr-2" />
                          Upload a file
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchLastRunDetails}>
                    <Info className="size-4" />
                    Last Run Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[1005px]">
                  <DialogHeader>
                    <DialogTitle>Last Run Details</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 max-h-[60vh] overflow-y-auto">
                    <ScrollArea className="h-full w-full">
                      <Markdown
                        components={{
                          code({ node, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return  match ? (
                              <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={a11yDark}
                                language={match[1]}
                                PreTag="div"
                              />
                            ) : (
                              <code {...props} className={className}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {`\`\`\`json\n${JSON.stringify(lastRunDetails, null, 2)}\n\`\`\``}
                      </Markdown>
                    </ScrollArea>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => {}}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={fetchLastRunDetails}>
                <RefreshCw className="size-4 mr-2" />
                Refresh
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Settings className="mr-2 size-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 size-4" />
                    <span>Help</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <ChatMessageList ref={messagesContainerRef}>
            {/* Chat messages */}
            <AnimatePresence>
              {messages.map((message, index) => {
                const variant = getMessageVariant(message.role!);
                return (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
                    transition={{
                      opacity: { duration: 0.05 },
                      layout: {
                        type: "spring",
                        bounce: 0.3,
                        duration: index * 0.05 + 0.2,
                      },
                    }}
                    style={{ originX: 0.5, originY: 0.5 }}
                    className="flex flex-col gap-2 p-4"
                  >
                    <ChatBubble key={index} variant={variant}>
                      <Avatar>
                        <AvatarImage
                          src=''
                          alt="Avatar"
                          className={message.role === "assistant" ? "dark:invert" : ""}
                        />
                        <AvatarFallback>🤖</AvatarFallback>
                      </Avatar>
                      <ChatBubbleMessage
                        variant={variant}
                      >
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code(props) {
                              const { children, className, node, ...rest } = props
                              const match = /language-(\w+)/.exec(className || '')

                              return match ? (
                                <div className="relative">
                                  <SyntaxHighlighter
                                    {...rest}
                                    PreTag="div"
                                    children={String(children).replace(/\n$/, '')}
                                    language={match[1]}
                                    style={a11yDark}
                                  />
                                  <button
                                    onClick={() => copyToClipboard(String(children))}
                                    className="absolute top-2 right-2 p-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                                  >
                                    {copiedCode === String(children) ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4 text-gray-300" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <code {...rest} className={className}>
                                  {children}
                                </code>
                              )
                            },
                          }}
                        >{message.text}</Markdown>

                        {message.role === "assistant" && (
                          <div className="flex items-center mt-1.5 gap-1">
                            {!message.isLoading && (
                              <>
                                {ChatAiIcons.map((icon, index) => {
                                  const Icon = icon.icon;
                                  return (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="icon"
                                      className="size-5"
                                    >
                                      <Icon className="size-3" />
                                    </Button>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        )}
                      </ChatBubbleMessage>
                    </ChatBubble>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </ChatMessageList>
        </ScrollArea>
        <div className="flex-1" />


        <form
          ref={formRef}
          onSubmit={handleSendMessage}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
        >
          <ChatInput
            ref={inputRef}
            onKeyDown={handleKeyDown}
            onChange={handleInputChange}
            placeholder="Type your message here..."
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <Paperclip className="size-4" />
              <span className="sr-only">Attach file</span>
            </Button>
            <input
              type="file"
              id="fileInput"
              className="hidden"
              onChange={e => handleChatFileUpload(e)}
            />

            <Button variant="ghost" size="icon">
              <Mic className="size-4" />
              <span className="sr-only">Use Microphone</span>
            </Button>

            <Button
              disabled={!input || runInProgress}
              type="submit"
              size="sm"
              className="ml-auto gap-1.5"
            >
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}