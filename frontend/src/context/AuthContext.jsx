import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) { setUser(null); setLoading(false); return; }
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch {
            localStorage.removeItem('token');
            setUser(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadUser();

        // When token changes in another tab, reload user here too
        const handleStorage = (e) => {
            if (e.key === 'token') loadUser();
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    const register = async (userData) => {
        const { full_address, state, city, zip_code, ...coreData } = userData;
        const res = await api.post('/auth/register', coreData);

        if (full_address && zip_code) {
            try {
                const loginRes = await api.post('/auth/login', {
                    email: coreData.email,
                    password: coreData.password,
                });
                localStorage.setItem('token', loginRes.data.token);
                await api.post('/address', { full_address, state, city, zip_code });
                localStorage.removeItem('token');
            } catch (e) {
                console.warn('Address save failed:', e);
            }
        }
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};