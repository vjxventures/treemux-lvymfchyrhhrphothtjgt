'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';

export default function EventChat({ eventId }: { eventId: string }) {
  const { chatMessages, loadingChat, fetchChat, sendMessage, currentUserId } = useAppStore();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchChat(eventId);
    // Poll for new messages every 3 seconds
    intervalRef.current = setInterval(() => fetchChat(eventId), 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [eventId, fetchChat]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(eventId, message.trim());
    setMessage('');
  };

  return (
    <div className="flex flex-col h-[300px]">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loadingChat ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            Loading chat...
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground text-sm">No messages yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Be the first to say something!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chatMessages.map((msg) => {
              const isMe = msg.user_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {msg.user_name?.[0] || '?'}
                  </div>
                  <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {isMe ? 'You' : msg.user_name}
                    </span>
                    <div className={`
                      mt-0.5 px-3 py-2 rounded-xl text-sm
                      ${isMe
                        ? 'bg-neon-pink/20 text-foreground rounded-tr-sm'
                        : 'bg-white/[0.06] text-foreground rounded-tl-sm'
                      }
                    `}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="bg-white/[0.04] border-white/[0.08] text-sm placeholder:text-muted-foreground/50"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim()}
          className="bg-neon-pink hover:bg-neon-pink/80 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
