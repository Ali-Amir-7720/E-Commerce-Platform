import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/chatContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { Send, X, MessageCircle, Loader2 } from 'lucide-react';

/**
 * ChatWindow
 * Props:
 *   roomType   — 'product' | 'order'
 *   roomId     — productId or orderId
 *   title      — display name in header
 *   onClose    — called when user closes the window
 */
const ChatWindow = ({ roomType, roomId, title, onClose }) => {
    const { user } = useAuth();
    const { joinProductRoom, joinOrderRoom, sendMessage, loadHistory, getRoomMessages } = useChat();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);

    const messages = getRoomMessages(roomType, roomId);

    // Load history and join room on mount
    useEffect(() => {
        const init = async () => {
            try {
                const endpoint = roomType === 'product'
                    ? `/chat/product/${roomId}`
                    : `/chat/order/${roomId}`;
                const res = await api.get(endpoint);
                loadHistory(roomType, roomId, res.data?.messages || []);
            } catch (err) {
                console.error('Failed to load chat history:', err);
            } finally {
                setLoading(false);
            }

            if (roomType === 'product') joinProductRoom(roomId);
            else joinOrderRoom(roomId);
        };
        init();
    }, [roomType, roomId]);

    // Auto scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(roomType, roomId, input.trim());
        setInput('');
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-[#0e1117] border border-white/10 w-[360px] h-[480px] max-w-full">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#141a24] border-b border-white/8">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-cyan-400" />
                    <div>
                        <p className="text-sm font-bold text-white leading-none">{title}</p>
                        <p className="text-xs text-white/50 mt-0.5 capitalize">{roomType} chat</p>
                    </div>
                </div>
                <button onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400"
                    aria-label="Close Chat"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                        <MessageCircle className="w-10 h-10 text-white/20" />
                        <p className="text-white/50 text-sm">No messages yet</p>
                        <p className="text-white/40 text-xs">Start the conversation</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && (
                                    <p className="text-xs text-white/60 mb-1 px-1">{msg.sender_name}</p>
                                )}
                                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                                    isMe
                                        ? 'bg-[#22d3ee] text-black rounded-br-sm'
                                        : 'bg-white/8 text-white/90 rounded-bl-sm'
                                }`}>
                                    {msg.message}
                                </div>
                                <p className="text-xs text-white/40 mt-1 px-1">{formatTime(msg.created_at)}</p>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/8">
                <div className="flex items-center gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none placeholder:text-white/40 bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                        aria-label="Message text"
                    />
                    <button onClick={handleSend} disabled={!input.trim()}
                        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 active:scale-95 bg-[#22d3ee] hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400"
                        aria-label="Send message"
                    >
                        <Send className="w-4 h-4 text-black" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;