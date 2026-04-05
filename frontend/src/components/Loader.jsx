import React from 'react';

const Loader = ({ fullScreen = false }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#080c10]/90 z-50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                        <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
                        <div className="absolute inset-2 rounded-full border-t-2 border-violet-400 animate-spin"
                            style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
                    </div>
                    <span className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase">Loading</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-8">
            <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
            </div>
        </div>
    );
};

export default Loader;