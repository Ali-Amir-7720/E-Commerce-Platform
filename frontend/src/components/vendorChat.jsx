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
            <h3 className="text-sm font-black text-white/70 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Customer Inquiries
            </h3>

            {loading ? (
                <p className="text-white/50 text-sm">Loading conversations...</p>
            ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <MessageCircle className="text-white/40" size={28} />
                    </div>
                    <h4 className="text-base font-semibold text-white mb-1">No inquiries yet</h4>
                    <p className="text-white/50 text-sm max-w-xs">
                        When customers ask about your products, their messages will show up here.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {conversations.map((conv, i) => (
                        <button key={i} onClick={() => setActiveChat(conv)}
                            className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all bg-white/[0.03] border border-white/8 hover:border-cyan-400/30 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-cyan-500/10">
                                <MessageCircle className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white/90 truncate">{conv.other_name}</p>
                                <p className="text-xs text-white/50 truncate">{conv.last_message}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
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