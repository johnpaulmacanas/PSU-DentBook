import { supabase } from '../lib/supabase';
import { sanitize } from '../lib/sanitize';
import { handleSupabaseError } from '../lib/errors';
import type { ChatChannel, ChatMessage, ServiceResult } from '../types';

const MESSAGE_SELECT = '*, sender:profiles(id, full_name, role)';

export class ChatService {
  /** Fetch all channels the current user belongs to */
  static async getMyChannels(): Promise<ServiceResult<ChatChannel[]>> {
    try {
      const { data, error } = await supabase
        .from('channel_members')
        .select('channel:chat_channels(*)')
        .order('joined_at', { ascending: false });

      if (error) return { data: null, error: error.message };
      const channels = (data ?? [])
        .map((row) => (row as { channel: ChatChannel | null }).channel)
        .filter((c): c is ChatChannel => Boolean(c));
      return { data: channels, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Fetch paginated messages for a channel (oldest-first in the result) */
  static async getMessages(
    channelId: string,
    limit = 50,
    before?: string
  ): Promise<ServiceResult<ChatMessage[]>> {
    try {
      let query = supabase
        .from('chat_messages')
        .select(MESSAGE_SELECT)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) query = query.lt('created_at', before);

      const { data, error } = await query;
      if (error) return { data: null, error: error.message };
      return { data: (data as unknown as ChatMessage[]).reverse(), error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Send a new message. Sanitized before insert. */
  static async sendMessage(
    channelId: string,
    senderId: string,
    content: string
  ): Promise<ServiceResult<ChatMessage>> {
    const safe = sanitize(content);
    if (!safe) return { data: null, error: 'Message cannot be empty.' };

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          sender_id:  senderId,
          content:    safe,
        })
        .select(MESSAGE_SELECT)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as ChatMessage, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Soft-delete a message (sets is_deleted = true) */
  static async deleteMessage(messageId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /**
   * Subscribe to real-time new messages in a channel.
   * Uses Supabase Realtime postgres_changes.
   * Returns the channel object so the caller can unsubscribe.
   */
  static subscribeToChannel(
    channelId: string,
    onMessage: (msg: ChatMessage) => void
  ) {
    return supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch the full message with its sender profile
          const { data } = await supabase
            .from('chat_messages')
            .select(MESSAGE_SELECT)
            .eq('id', (payload.new as { id: string }).id)
            .single();

          const msg = data as unknown as ChatMessage | null;
          if (msg && !msg.is_deleted) onMessage(msg);
        }
      )
      .subscribe();
  }

  /** Create a new channel (admin only via RLS) */
  static async createChannel(
    name: string,
    description: string,
    createdBy: string
  ): Promise<ServiceResult<ChatChannel>> {
    try {
      const { data, error } = await supabase
        .from('chat_channels')
        .insert({
          name:        sanitize(name),
          description: sanitize(description),
          created_by:  createdBy,
        })
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as ChatChannel, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }

  /** Add a user to a channel (admin only via RLS) */
  static async joinChannel(
    channelId: string,
    profileId: string
  ): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase
        .from('channel_members')
        .upsert({ channel_id: channelId, profile_id: profileId });

      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return handleSupabaseError(err);
    }
  }
}
