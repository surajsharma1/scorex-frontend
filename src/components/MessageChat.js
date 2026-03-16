import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { messageAPI } from '../services/api';
import { Send, X, Loader, MessageCircle } from 'lucide-react';
import { socketService } from '../services/socket'; // Use singleton
const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            return decoded.userId || decoded.id || decoded._id || '';
        }
        catch (error) {
            console.error('Error decoding token:', error);
        }
    }
    return '';
};
const MessageChat = ({ friend, onClose }) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const currentUserId = getCurrentUserId();
    const socket = socketService.getSocket();
    useEffect(() => {
        loadMessages();
        // Join a room for this conversation (optional, depending on backend)
        // socket.emit('joinChat', { userId: currentUserId, friendId: friend._id });
        const handleNewMessage = (msg) => {
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
            const response = await messageAPI.getMessages({ recipientId: friend._id }); // FIXED: object param
            setMessages(response.data.messages || []);
            scrollToBottom();
        }
        catch (error) {
            console.error('Failed to load messages');
        }
        finally {
            setLoading(false);
        }
    };
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim())
            return;
        setSending(true);
        try {
            // Optimistic Update
            const tempMsg = {
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
            await messageAPI.sendMessage({ recipientId: friend._id, content: tempMsg.content }); // FIXED: object param
            // Real confirmation will come via socket or re-fetch
        }
        catch (error) {
            console.error('Failed to send message');
        }
        finally {
            setSending(false);
        }
    };
    return (_jsxs("div", { className: "fixed bottom-4 right-4 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden", children: [_jsxs("div", { className: "bg-blue-600 p-4 text-white flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold", children: friend.username.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold", children: friend.username }), _jsxs("span", { className: "text-xs text-blue-200 flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 bg-green-400 rounded-full" }), " Online"] })] })] }), _jsx("button", { onClick: onClose, className: "hover:bg-white/20 p-2 rounded-full transition", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-4", children: [loading ? (_jsx("div", { className: "flex justify-center items-center h-full", children: _jsx(Loader, { className: "animate-spin text-blue-500" }) })) : messages.length === 0 ? (_jsxs("div", { className: "text-center text-gray-400 mt-20", children: [_jsx(MessageCircle, { className: "w-12 h-12 mx-auto mb-2 opacity-20" }), _jsx("p", { children: "No messages yet." }), _jsxs("p", { className: "text-sm", children: ["Say hello to ", friend.username, "!"] })] })) : (messages.map((msg, index) => {
                        const isMe = msg.from === currentUserId;
                        return (_jsx("div", { className: `flex ${isMe ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-[75%] p-3 rounded-2xl text-sm ${isMe
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-tl-none'}`, children: [msg.content, _jsx("div", { className: `text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`, children: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }) }, index));
                    })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("form", { onSubmit: handleSendMessage, className: "p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2", children: [_jsx("input", { type: "text", value: newMessage, onChange: (e) => setNewMessage(e.target.value), placeholder: "Type a message...", className: "flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("button", { type: "submit", disabled: !newMessage.trim() || sending, className: "p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition", children: _jsx(Send, { className: "w-5 h-5" }) })] })] }));
};
export default MessageChat;
