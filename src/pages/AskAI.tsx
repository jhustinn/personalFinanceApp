import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Bot, Send, Loader, PlusCircle, Trash2, Sparkles
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { transactionService } from '../services/transactionService';
import { generativeModel } from '../lib/gemini';
import { chatService, NewChatMessage, ChatSession } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: string;
  suggestions?: string[];
}

const initialMessage: ChatMessage = {
  id: 'initial-ai-message',
  type: 'ai',
  message: 'Halo! Saya adalah asisten keuangan AI Anda. Riwayat percakapan kita akan tersimpan otomatis. Silakan ajukan pertanyaan atau mulai percakapan baru.',
  timestamp: new Date().toISOString(),
  suggestions: [
    'Analisa pengeluaran saya bulan ini',
    'Bandingkan pengeluaran bulan ini dan bulan lalu',
    'Apa kategori pengeluaran terbesar saya tahun ini?',
    'Berapa total pemasukan saya 6 bulan terakhir?'
  ]
};

export const AskAI: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadSessions = useCallback(async () => {
    if (!user) return [];
    setIsLoadingSessions(true);
    try {
      const loadedSessions = await chatService.getChatSessions();
      setSessions(loadedSessions);
      return loadedSessions;
    } catch (err) {
      setError("Gagal memuat daftar percakapan.");
      return [];
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user]);

  const loadMessages = useCallback(async (sessionId: string) => {
    if (!user) return;
    setIsLoadingHistory(true);
    setError(null);
    try {
      const history = await chatService.getMessagesBySession(sessionId);
      if (history.length > 0) {
        setMessages(history.map(msg => ({
          id: msg.id,
          type: msg.type,
          message: msg.message,
          timestamp: msg.created_at,
        })));
      } else {
        setMessages([initialMessage]);
      }
    } catch (err) {
      setError("Gagal memuat riwayat percakapan.");
      setMessages([initialMessage]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  // Effect to initialize or load session on user change
  useEffect(() => {
    if (user) {
      loadSessions().then(loadedSessions => {
        const sid = sessionStorage.getItem('ai_chat_session_id');
        if (sid) {
          setActiveSessionId(sid);
        } else if (loadedSessions.length > 0) {
          const newSid = loadedSessions[0].session_id;
          setActiveSessionId(newSid);
          sessionStorage.setItem('ai_chat_session_id', newSid);
        } else {
          handleNewChat();
        }
      });
    } else {
      setIsLoadingHistory(false);
      setIsLoadingSessions(false);
      setMessages([initialMessage]);
    }
  }, [user]); // Removed loadSessions from deps to prevent re-running

  // Effect to load messages when active session changes
  useEffect(() => {
    if (activeSessionId && user) {
      const sessionExists = sessions.some(s => s.session_id === activeSessionId);
      if (sessionExists) {
        loadMessages(activeSessionId);
      } else {
        // This is a new chat session that doesn't exist in the DB yet.
        // Reset to the initial message state.
        setMessages([initialMessage]);
        setIsLoadingHistory(false);
      }
    }
  }, [activeSessionId, sessions, user]); // Removed loadMessages to be more explicit

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  const handleNewChat = () => {
    const newSid = uuidv4();
    sessionStorage.setItem('ai_chat_session_id', newSid);
    setActiveSessionId(newSid);
    // The useEffect for activeSessionId change will handle setting messages
  };

  const handleSelectSession = (sessionId: string) => {
    sessionStorage.setItem('ai_chat_session_id', sessionId);
    setActiveSessionId(sessionId);
  };

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus percakapan ini? Tindakan ini tidak dapat diurungkan.")) {
      return;
    }
    try {
      await chatService.deleteSession(sessionIdToDelete);
      const updatedSessions = sessions.filter(s => s.session_id !== sessionIdToDelete);
      setSessions(updatedSessions);

      if (activeSessionId === sessionIdToDelete) {
        if (updatedSessions.length > 0) {
          handleSelectSession(updatedSessions[0].session_id);
        } else {
          handleNewChat();
        }
      }
    } catch (err: any) {
      setError(`Gagal menghapus percakapan: ${err.message}`);
    }
  };

  const isAnalysisRequest = (message: string): boolean => {
    const keywords = ['analisa', 'analisis', 'analyze', 'ringkas', 'summary', 'bandingkan', 'compare', 'tren', 'trend', 'kategori', 'pemasukan'];
    const lowerCaseMessage = message.toLowerCase();
    return keywords.some(keyword => lowerCaseMessage.includes(keyword));
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !activeSessionId) return;

    const isNewSession = !sessions.some(s => s.session_id === activeSessionId);

    const userMessage: ChatMessage = {
      id: uuidv4(), type: 'user', message: message.trim(), timestamp: new Date().toISOString()
    };

    setMessages(prev => (prev[0]?.id === 'initial-ai-message' ? [userMessage] : [...prev, userMessage]));
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      await chatService.saveMessage({ session_id: activeSessionId, type: 'user', message: message.trim() });

      if (isNewSession) {
        // Refresh session list to show the new session immediately
        await loadSessions();
      }

      let aiResponseText: string;
      if (isAnalysisRequest(message.trim())) {
        aiResponseText = await performAnalysis(message.trim());
      } else {
        const chat = generativeModel.startChat();
        const result = await chat.sendMessage(message.trim());
        aiResponseText = result.response.text() || 'Maaf, saya tidak bisa memproses permintaan tersebut.';
      }

      const aiResponse: ChatMessage = {
        id: uuidv4(), type: 'ai', message: aiResponseText, timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiResponse]);

      await chatService.saveMessage({ session_id: activeSessionId, type: 'ai', message: aiResponseText });
    } catch (error: any) {
      const errorMessageText = `Maaf, terjadi kesalahan: ${error.message}.`;
      setError(errorMessageText);
      const errorMessage: ChatMessage = {
        id: uuidv4(), type: 'ai', message: errorMessageText, timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const performAnalysis = async (prompt: string): Promise<string> => {
    try {
      const today = new Date();
      let date_from, date_to = today.toISOString().split('T')[0];
      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes('bulan ini')) date_from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      else if (lowerPrompt.includes('tahun ini')) date_from = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      else if (lowerPrompt.includes('3 bulan terakhir')) { const d = new Date(); d.setMonth(d.getMonth() - 3); date_from = d.toISOString().split('T')[0]; }
      else if (lowerPrompt.includes('6 bulan terakhir')) { const d = new Date(); d.setMonth(d.getMonth() - 6); date_from = d.toISOString().split('T')[0]; }
      
      const transactions = await transactionService.getTransactionsFiltered({ date_from, date_to });
      if (transactions.length === 0) return "Maaf, tidak ada data transaksi pada periode yang Anda tentukan untuk dianalisis.";
      
      const sanitized = transactions.map(({ user_id, wallet, category, ...r }) => ({ ...r, wallet_name: wallet?.name, category_name: category?.name }));
      const analysisPrompt = `Anda adalah analis keuangan ahli. Berdasarkan data transaksi dalam format JSON ini, berikan jawaban yang jelas dan mendalam untuk pertanyaan pengguna. Jawaban harus dalam format markdown Bahasa Indonesia yang rapi.\n\nPertanyaan Pengguna: "${prompt}"\n\nData Transaksi:\n${JSON.stringify(sanitized, null, 2)}`;
      const result = await generativeModel.generateContent(analysisPrompt);
      return result.response.text();
    } catch (dbError: any) {
      return `Gagal mengambil data transaksi: ${dbError.message}.`;
    }
  };

  const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const renderMessageContent = (message: string) => ({ __html: message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') });
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(inputMessage); } };

  const showSuggestions = messages.length === 1 && messages[0].id === 'initial-ai-message';

  return (
    <Layout title="Ask AI">
      <div className="flex h-[calc(100vh-100px)] bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 lg:w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Percakapan Baru</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingSessions ? (
              <div className="flex justify-center items-center h-full"><Loader className="w-6 h-6 text-blue-600 animate-spin" /></div>
            ) : (
              <nav className="p-2 space-y-1">
                {sessions.map(session => (
                  <div key={session.session_id} className="relative group">
                    <button
                      onClick={() => handleSelectSession(session.session_id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeSessionId === session.session_id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <p className="font-medium text-sm truncate pr-8">{session.first_message}</p>
                      <p className={`text-xs ${activeSessionId === session.session_id ? 'text-blue-600' : 'text-gray-500'}`}>
                        {formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true, locale: id })}
                      </p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.session_id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Hapus percakapan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="w-2/3 lg:w-3/4 flex flex-col bg-white">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Financial Assistant</h3>
                <p className="text-sm text-gray-500">Online</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-full"><Loader className="w-8 h-8 text-blue-600 animate-spin" /></div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md lg:max-w-lg ${msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-3`}>
                      <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={renderMessageContent(msg.message)} />
                      <p className={`text-xs mt-1 text-right w-full ${msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>{formatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {isTyping && <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-600">Menganalisis...</div></div>}
                <div ref={chatMessagesEndRef} />
              </>
            )}
          </div>

          <div className="border-t border-gray-200 p-4 bg-white">
            {error && <p className="text-red-600 text-sm mb-2 text-center">{error}</p>}
            
            {showSuggestions && (
              <div className="mb-4 px-2">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>Coba salah satu dari ini:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {initialMessage.suggestions?.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      disabled={isTyping || !user}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3 items-end">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
                placeholder={user ? "Ketik pesan Anda..." : "Silakan login untuk memulai percakapan."}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none overflow-hidden max-h-32"
                disabled={isTyping || !user || isLoadingHistory}
              />
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isTyping || !user || isLoadingHistory}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Kirim</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
