import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#080c10' }}>
            <Navbar />
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
            <footer className="border-t border-white/8 py-6 mt-auto" style={{ background: '#0e1117' }}>
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-white/30">
                    &copy; {new Date().getFullYear()} Nexus E-Commerce. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;