import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState({});

    useEffect(() => {
        // Get token directly from localStorage — AuthContext stores it there
        const token = localStorage.getItem('token');
        if (!user || !token) {
            // Disconnect if user logs out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        // Avoid creating duplicate connections
        if (socketRef.current?.connected) return;

        const socket = io(import.meta.env.VITE_API_URL, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            setConnected(true);
            console.log('[Chat] Connected');
        });

        socket.on('disconnect', () => {
            setConnected(false);
            console.log('[Chat] Disconnected');
        });

        socket.on('message', (msg) => {
            const key = `${msg.room_type}:${msg.room_id}`;
            setMessages(prev => ({
                ...prev,
                [key]: [...(prev[key] || []), msg],
            }));
        });

        socket.on('error', (err) => {
            console.error('[Chat] Error:', err.message);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user]);

    const joinProductRoom = (productId) => {
        socketRef.current?.emit('join_product', { productId });
    };

    const joinOrderRoom = (orderId) => {
        socketRef.current?.emit('join_order', { orderId });
    };

    const sendMessage = (roomType, roomId, message) => {
        socketRef.current?.emit('send_message', {
            room_type: roomType,
            room_id: roomId,
            message,
        });
    };

    const loadHistory = (roomType, roomId, history) => {
        const key = `${roomType}:${roomId}`;
        setMessages(prev => ({ ...prev, [key]: history }));
    };

    const getRoomMessages = (roomType, roomId) => {
        return messages[`${roomType}:${roomId}`] || [];
    };

    return (
        <ChatContext.Provider value={{
            connected,
            joinProductRoom,
            joinOrderRoom,
            sendMessage,
            loadHistory,
            getRoomMessages,
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);