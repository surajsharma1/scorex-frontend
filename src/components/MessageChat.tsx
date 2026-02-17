import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Message } from './types';
import { messageAPI } from '../services/api';
import { Send, X, Loader, MessageCircle } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface MessageChatProps {
  friend: User;
  onClose: () => void;
}

const getCurrentUserId = (): string => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.userId || decoded.id || decoded._id || '';
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }
  return '';
};

const MessageChat: React.FC<MessageChatProps> = ({ friend, onClose }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    loadMessages();
    
    // Setup socket for real-time messaging
    const newSocket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('joinChat', { userId: currentUserId, friendId: friend._id });

    newSocket.on('newMessage', (message: Message) => {
      if (
        (message.from === friend._id && message.to === currentUserId) ||
        (message.from === currentUserId && message.to === friend._id)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      newSocket.emit('leaveChat', { userId: currentUserId, friendId: friend._id });
      newSocket.close();
    };
  }, [friend._id, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getMessages(friend._id);
      const messagesArray = Array.isArray(response.data) 
        ? response.data 
        : (Array.isArray(response.data?.messages) ? response.data.messages : []);
      setMessages(messagesArray);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await messageAPI.sendMessage(friend._id, newMessage.trim());
      const sentMessage = response.data?.message || response.data;
      if (sentMessage) {
        setMessages((prev) => [...prev, sentMessage]);
      }
      setNewMessage('');
      
      // Emit socket event for real-time delivery
      if (socket) {
        socket.emit('sendMessage', {
          from: currentUserId,
          to: friend._id,
          content: newMessage.trim(),
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-bg-alt rounded-lg shadow-xl w-full max-w-lg h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-primary/30 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-blue-500 dark:bg-dark-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {friend.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900 dark:text-dark-light">{friend.username}</h3>
              {friend.fullName && (
                <p className="text-xs text-gray-500 dark:text-dark-accent/70">{friend.fullName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-dark-accent/50 dark:hover:text-dark-light rounded-lg hover:bg-gray-100 dark:hover:bg-dark-primary/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader className="animate-spin h-8 w-8 text-blue-600 dark:text-dark-accent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-dark-accent/70">
              <MessageCircle className="h-12 w-12 mb-2" />
              <p>{t('messages.noMessages', 'No messages yet')}</p>
              <p className="text-sm">{t('messages.startConversation', 'Start the conversation!')}</p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex justify-center mb-4">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-dark-primary/30 rounded-full text-xs text-gray-500 dark:text-dark-accent">
                    {date}
                  </span>
                </div>
                {dateMessages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.from === currentUserId ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                        message.from === currentUserId
                          ? 'bg-blue-500 dark:bg-dark-primary text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-dark-bg text-gray-900 dark:text-dark-light rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.from === currentUserId
                            ? 'text-blue-100 dark:text-dark-accent/70'
                            : 'text-gray-500 dark:text-dark-accent/50'
                        }`}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-dark-primary/30">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('messages.typeMessage', 'Type a message...')}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-primary/30 rounded-full focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-accent bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="p-2 bg-blue-500 dark:bg-dark-primary text-white rounded-full hover:bg-blue-600 dark:hover:bg-dark-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageChat;
