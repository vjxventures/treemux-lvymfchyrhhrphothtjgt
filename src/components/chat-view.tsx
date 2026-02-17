"use client";

import { useState, useEffect, useRef } from "react";
import { getMessages, sendMessage } from "@/lib/actions";
import { formatTimeAgo } from "@/lib/categories";
import type { User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageCircle, Hash, Users } from "lucide-react";

interface ConversationData {
  id: string;
  type: string;
  title: string;
  last_message: string;
  last_sender_name: string;
  last_message_at: string;
  unread_count: number;
}

interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  content: string;
  created_at: string;
}

interface ChatViewProps {
  conversations: never[];
  user: User;
}

export function ChatView({ conversations, user }: ChatViewProps) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const typedConversations = conversations as unknown as ConversationData[];
  const selectedConv = typedConversations.find((c) => c.id === selectedConvId);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
    }
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages(convId: string) {
    const msgs = await getMessages(convId);
    setMessages(msgs as MessageData[]);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvId) return;

    setSending(true);
    await sendMessage(selectedConvId, newMessage.trim());
    setNewMessage("");
    await loadMessages(selectedConvId);
    setSending(false);
  }

  // Conversation list
  if (!selectedConvId) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 pb-2">
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-bricolage)" }}>
            Messages
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {typedConversations.length} conversations
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 pt-2 space-y-1">
            {typedConversations.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Join events to start chatting!</p>
              </div>
            ) : (
              typedConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className="w-full text-left p-3 rounded-xl hover:bg-secondary/50 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    {conv.type === "event" ? (
                      <Hash className="w-4 h-4 text-muted-foreground" />
                    ) : conv.type === "community" ? (
                      <Users className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium truncate">{conv.title}</h3>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {formatTimeAgo(conv.last_message_at)}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.last_sender_name}: {conv.last_message}
                      </p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge className="shrink-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0 min-w-[18px] justify-center">
                      {conv.unread_count}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Message view
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => setSelectedConvId(null)} className="h-9 w-9 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{selectedConv?.title}</h2>
          <span className="text-xs text-muted-foreground capitalize">{selectedConv?.type} chat</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                {!isMe && (
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarImage src={msg.sender_avatar} />
                    <AvatarFallback className="text-[10px]">{msg.sender_name[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] ${isMe ? "text-right" : ""}`}>
                  {!isMe && (
                    <p className="text-[10px] text-muted-foreground mb-0.5 px-1">{msg.sender_name.split(" ")[0]}</p>
                  )}
                  <div
                    className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5 px-1">
                    {formatTimeAgo(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 border-t border-border/50 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-secondary/50 border-border/50 rounded-xl"
        />
        <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={sending || !newMessage.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
