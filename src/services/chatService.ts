import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessageData {
  id: string;
  user_id: string;
  session_id: string;
  type: 'user' | 'ai';
  message: string;
  created_at: string;
}

export interface NewChatMessage {
  session_id: string;
  type: 'user' | 'ai';
  message: string;
}

export interface ChatSession {
  session_id: string;
  first_message: string;
  last_message_at: string;
}

export const chatService = {
  async getChatSessions(): Promise<ChatSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_user_chat_sessions');

    if (error) {
      console.error("Error fetching chat sessions:", error);
      throw error;
    }
    return data || [];
  },

  async getMessagesBySession(sessionId: string): Promise<ChatMessageData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const { data, error } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching chat history:", error);
      throw error;
    }

    return data || [];
  },

  async saveMessage(messageData: NewChatMessage): Promise<ChatMessageData | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const messageToInsert = {
      ...messageData,
      id: uuidv4(),
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('ai_chat_messages')
      .insert(messageToInsert)
      .select()
      .single();

    if (error) {
      console.error("Error saving chat message:", error);
      throw error;
    }

    return data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const { error } = await supabase
      .from('ai_chat_messages')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error("Error deleting chat session:", error);
      throw error;
    }
  }
};
