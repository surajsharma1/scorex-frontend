import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Message } from './types';
import { messageAPI } from '../services/api';
import { Send, X, Loader, MessageCircle } from 'lucide-react';
import { socketService } from '../services/socket'; // Use singleton

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = getCurrentUserId();
  const socket = socketService.getSocket();

  useEffect(() => {
    loadMessages();
    
    // Join a room for this conversation (optional, depending on backend)
    // socket.emit('joinChat', { userId: currentUserId, friendId: friend._id });

    const handleNewMessage = (msg: Message) => {
        // Only append if it belongs to this conversation
        if (msg.from === friend._id || (msg.from === currentUserId && msg.to === friend._id)) {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
        }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
        socket.off('newMessage', handleNewMessage);
    };
  }, [friend._id]);

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getMessages(friend._id);
      setMessages(response.data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      // Optimistic Update
      const tempMsg: Message = {
          _id: Date.now().toString(),
          from: currentUserId,
          to: friend._id,
          content: newMessage,
          read: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMsg]);
      setNewMessage('');
      scrollToBottom();

      await messageAPI.sendMessage(friend._id, tempMsg.content);
      // Real confirmation will come via socket or re-fetch
    } catch (error) {
      console.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                {friend.username.charAt(0).toUpperCase()}
            </div>
            <div>
                <h3 className="font-bold">{friend.username}</h3>
                <span className="text-xs text-blue-200 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span> Online
                </span>
            </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-4">
          {loading ? (
              <div className="flex justify-center items-center h-full">
                  <Loader className="animate-spin text-blue-500" />
              </div>
          ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No messages yet.</p>
                  <p className="text-sm">Say hello to {friend.username}!</p>
              </div>
          ) : (
              messages.map((msg, index) => {
                  const isMe = msg.from === currentUserId;
                  return (
                      <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                              isMe 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-tl-none'
                          }`}>
                              {msg.content}
                              <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                          </div>
                      </div>
                  );
              })
          )}
          <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition"
          >
              <Send className="w-5 h-5" />
          </button>
      </form>
    </div>
  );
};

export default MessageChat;