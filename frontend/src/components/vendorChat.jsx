import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useChat } from '../context/chatContext';
import { useAuth } from '../context/AuthContext';
import ChatWindow from './chatWindow';
import { MessageCircle, ChevronRight } from 'lucide-react';

/**
 * VendorChat
 * Drop this anywhere in VendorDashboard to show all customer conversations.
 */
const VendorChat = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/chat/conversations')
            .then(res => setConversations(Array.isArray(res.data) ? res.data : []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="mt-8">
            <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Customer Inquiries
            </h3>

            {loading ? (
                <p className="text-white/20 text-sm">Loading conversations...</p>
            ) : conversations.length === 0 ? (
                <div className="py-10 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-white/10" />
                    <p className="text-white/25 text-sm">No customer inquiries yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {conversations.map((conv, i) => (
                        <button key={i} onClick={() => setActiveChat(conv)}
                            className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:bg-white/5"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'rgba(34,211,238,0.1)' }}>
                                <MessageCircle className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white/80 truncate">{conv.other_name}</p>
                                <p className="text-xs text-white/30 truncate">{conv.last_message}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                        </button>
                    ))}
                </div>
            )}

            {/* Active chat window */}
            {activeChat && (
                <div className="fixed bottom-6 right-6 z-50">
                    <ChatWindow
                        roomType={activeChat.room_type}
                        roomId={activeChat.room_id}
                        title={`${activeChat.other_name} — ${activeChat.title}`}
                        onClose={() => setActiveChat(null)}
                    />
                </div>
            )}
        </div>
    );
};

export default VendorChat;