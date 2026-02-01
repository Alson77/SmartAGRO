import React, { useState, useRef, useEffect } from 'react';
import FarmerLayout from '../../components/Layout/FarmerLayout';
import { Send, Bot, User, Trash2, PlusCircle, MessageSquare, Menu, X, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  _id?: string;
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatSession {
  _id: string;
  title: string;
  lastMessageAt: Date;
  messageCount: number;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-full backdrop-blur-sm">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
          <p className="text-sm text-red-600 mt-3 font-medium">⚠️ This action cannot be undone.</p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Chatbot: React.FC = () => {
  const { user } = useAuth();
  
  // OpenRouter API (same as chatbotx/index.html)
  const AI_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  // Use environment variable for API key (see .env and Vite docs)
  const API_KEY = import.meta.env.VITE_CHATBOT_API_KEY;
  const MODEL = 'google/gemma-3n-e4b-it:free';

  const defaultMessage: Message = {
    id: '1',
    text: "Hello! I'm Krishi Sathi - your smart farming assistant. I can help you with crop advice, disease identification, weather information, and farming best practices. How can I help you today?",
    sender: 'bot',
    timestamp: new Date()
  };

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([defaultMessage]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalType, setDeleteModalType] = useState<'session' | 'all'>('session');
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  // Load all sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      if (!user?.id) {
        setSessionsLoading(false);
        setHistoryLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('krishisathi_token');
        const response = await fetch('/api/chat/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const sessionsData = await response.json();
          setSessions(sessionsData);
          
          // If there are sessions, load the most recent one
          if (sessionsData.length > 0) {
            setCurrentSessionId(sessionsData[0]._id);
          }
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setSessionsLoading(false);
      }
    };

    loadSessions();
  }, [user?.id]);

  // Load messages when session changes
  useEffect(() => {
    const loadSessionMessages = async () => {
      if (!currentSessionId || !user?.id) {
        setHistoryLoading(false);
        setMessages([defaultMessage]);
        return;
      }

      setHistoryLoading(true);
      try {
        const token = localStorage.getItem('krishisathi_token');
        const response = await fetch(`/api/chat/sessions/${currentSessionId}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const messagesData = await response.json();
          if (messagesData.length > 0) {
            const formattedMessages = messagesData.map((msg: any, index: number) => ({
              id: msg._id || `${currentSessionId}-${index}`,
              _id: msg._id,
              text: msg.text,
              sender: msg.sender,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(formattedMessages);
          } else {
            setMessages([defaultMessage]);
          }
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadSessionMessages();
  }, [currentSessionId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const startNewChat = async () => {
    try {
      const token = localStorage.getItem('krishisathi_token');
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession._id);
        setMessages([defaultMessage]);
        setError(null);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      setError('Failed to create new chat');
    }
  };

  const openDeleteModal = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteModalType('session');
    setDeleteModalOpen(true);
  };

  const openClearAllModal = () => {
    setDeleteModalType('all');
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSessionToDelete(null);
    setIsDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    if (deleteModalType === 'session' && sessionToDelete) {
      await deleteSession(sessionToDelete);
    } else if (deleteModalType === 'all') {
      await clearHistory();
    }
  };

  const deleteSession = async (sessionId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const token = localStorage.getItem('krishisathi_token');
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove session from list
        setSessions(prev => prev.filter(s => s._id !== sessionId));
        
        // If deleted session was current, switch to another or reset
        if (currentSessionId === sessionId) {
          const remainingSessions = sessions.filter(s => s._id !== sessionId);
          if (remainingSessions.length > 0) {
            setCurrentSessionId(remainingSessions[0]._id);
          } else {
            setCurrentSessionId(null);
            setMessages([defaultMessage]);
          }
        }
        closeDeleteModal();
      } else {
        setError('Failed to delete chat');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete chat');
      setIsDeleting(false);
    }
  };

  const clearHistory = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const token = localStorage.getItem('krishisathi_token');
      const response = await fetch('/api/chat/history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSessions([]);
        setCurrentSessionId(null);
        setMessages([defaultMessage]);
        closeDeleteModal();
      } else {
        setError('Failed to clear chat history');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      setError('Failed to clear chat history');
      setIsDeleting(false);
    }
  };

  // Call the OpenRouter AI API with agricultural context
  const getBotResponse = async (userMessage: string): Promise<string> => {
    setError(null);
    
    try {
      // Prepend agricultural context to user message (Gemma model doesn't support system messages)
      const contextualMessage = `[You are Krishi Sathi, an expert agricultural assistant. ONLY answer farming/agriculture questions. For non-agricultural topics, politely decline and redirect to farming. Provide practical advice in simple language.]

User question: ${userMessage}`;
      
      const res = await fetch(AI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'X-Title': 'Krishi Sathi Chatbot',
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'user', content: contextualMessage }
          ]
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error Response:', res.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(`API returned ${res.status}: ${errorData.error?.message || errorData.message || 'Unknown error'}`);
      }
      
      const data = await res.json();
      const botReply = data.choices?.[0]?.message?.content || 'Sorry, I could not understand that.';
      return botReply;
    } catch (err: any) {
      console.error('AI API Error:', err);
      setError(`Connection error: ${err.message}. Please check your internet connection and try again.`);
      return 'Sorry, I am unable to connect to the AI service right now. This could be due to:\n\n1. Internet connection issues\n2. API service temporarily unavailable\n3. API rate limits reached\n\nPlease try again in a few moments. If the problem persists, contact support.';
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const answer = await getBotResponse(userMessage.text);
    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: answer,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botResponse]);
    setIsLoading(false);

    // Save messages to current session (or create new session if none)
    try {
      const token = localStorage.getItem('krishisathi_token');
      let sessionId = currentSessionId;

      // If no session exists, create one first
      if (!sessionId) {
        const sessionResponse = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (sessionResponse.ok) {
          const newSession = await sessionResponse.json();
          sessionId = newSession._id;
          setCurrentSessionId(sessionId);
          setSessions(prev => [newSession, ...prev]);
        }
      }

      if (sessionId) {
        const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [
              { text: userMessage.text, sender: 'user', timestamp: userMessage.timestamp },
              { text: botResponse.text, sender: 'bot', timestamp: botResponse.timestamp }
            ]
          })
        });

        if (response.ok) {
          const { session: updatedSession } = await response.json();
          // Update session in list
          setSessions(prev => prev.map(s => s._id === updatedSession._id ? updatedSession : s));
        }
      }
    } catch (error) {
      console.error('Failed to save messages:', error);
      // Continue even if save fails
    }
  };

  return (
    <FarmerLayout>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title={deleteModalType === 'all' ? 'Clear All Chat History' : 'Delete Chat'}
        message={
          deleteModalType === 'all'
            ? 'Are you sure you want to delete all chat conversations? All your chat history will be permanently removed.'
            : 'Are you sure you want to delete this chat conversation? All messages in this chat will be permanently removed.'
        }
        isDeleting={isDeleting}
      />

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Farming Assistant</h1>
          <p className="text-gray-600">Ask questions about crop care, diseases, and farming practices</p>
        </div>

        <div className="flex gap-4 h-[calc(100vh-250px)]">
          {/* Main Chat Area */}
          <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all backdrop-blur-sm"
                    title="Toggle sidebar"
                  >
                    {sidebarOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
                  </button>
                  <div className="bg-white bg-opacity-20 p-2 rounded-full backdrop-blur-sm">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Krishi Sathi AI 🤖</h2>
                    <p className="text-sm text-green-100">● Always here to help</p>
                  </div>
                </div>
              </div>
            </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scrollbar-thin">
            {historyLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-3"></div>
                  <p className="text-gray-600">Loading chat history...</p>
                </div>
              </div>
            ) : (
              <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`flex max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-br from-green-500 to-emerald-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div>
                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-r-4 border-blue-700'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border-l-4 border-green-500'
                    }`}>
                      {message.sender === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                      ) : (
                        <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700 prose-code:text-green-700 prose-code:bg-green-50 prose-code:px-1 prose-code:rounded">
                          <ReactMarkdown>{message.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${
                      message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-3 rounded-2xl border-l-4 border-green-500 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                <p className="text-red-700 text-sm">⚠️ {error}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
            </>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about farming..."
                className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
            </div>
          </div>

          {/* Sidebar - Chat Sessions */}
          {sidebarOpen && (
            <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <button
                  onClick={startNewChat}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  New Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                {sessionsLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No chat history yet
                  </div>
                ) : (
                  sessions.map(session => (
                    <div
                      key={session._id}
                      className={`relative group rounded-lg mb-2 transition-colors ${
                        currentSessionId === session._id
                          ? 'bg-green-50 border border-green-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <button
                        onClick={() => setCurrentSessionId(session._id)}
                        className="w-full text-left p-3 rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 mt-1 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {session.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(session.lastMessageAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(session._id);
                        }}
                        className="absolute top-3 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                        title="Delete chat"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500 hover:text-red-600" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={openClearAllModal}
                  disabled={sessions.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All History
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">💡</span>
            Quick Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              '🌿 How to identify plant diseases?',
              '🧪 Best fertilizers for vegetables?',
              '🍅 When to harvest tomatoes?',
              '🐛 How to control pests naturally?',
              '💧 Proper watering techniques?',
              '🌱 Soil preparation tips?'
            ].map((question) => (
              <button
                key={question}
                onClick={() => setInputMessage(question)}
                disabled={isLoading}
                className="text-left p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:from-green-100 hover:to-emerald-100 hover:shadow-md transition-all text-sm text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
};

export default Chatbot;