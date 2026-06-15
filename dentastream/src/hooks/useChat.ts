import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { ChatService } from '../services/ChatService';
import type { ChatMessage } from '../types';

export function useChat(channelId: string | null, senderId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const realtimeRef = useRef<RealtimeChannel | null>(null);

  // Load initial messages
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    ChatService.getMessages(channelId).then(({ data, error }) => {
      if (error) setError(error);
      else setMessages(data ?? []);
      setLoading(false);
    });
  }, [channelId]);

  // Subscribe to real-time
  useEffect(() => {
    if (!channelId) return;

    realtimeRef.current = ChatService.subscribeToChannel(channelId, (msg) => {
      setMessages(prev => {
        // Deduplicate by id
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      realtimeRef.current?.unsubscribe();
      realtimeRef.current = null;
    };
  }, [channelId]);

  const send = useCallback(async (content: string) => {
    if (!channelId || !senderId) return;
    const { error } = await ChatService.sendMessage(channelId, senderId, content);
    if (error) setError(error);
  }, [channelId, senderId]);

  return { messages, loading, error, send };
}
