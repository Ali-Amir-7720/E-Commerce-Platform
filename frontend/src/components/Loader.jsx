import React from 'react';

const Loader = ({ fullScreen = false, inline = false, size = 48 }) => {
    if (inline) {
        return (
            <div
                className="border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin [animation-duration:0.7s]"
                style={{ width: size, height: size }}
            />
        );
    }

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#080c10]/90 z-50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                        <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
                        <div className="absolute inset-2 rounded-full border-t-2 border-violet-400 animate-spin [animation-direction:reverse] [animation-duration:0.7s]" />
                    </div>
                    <span className="text-xs font-mono text-white/50 tracking-[0.2em] uppercase">Loading</span>
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

// Skeleton loading states
export const CardSkeleton = () => (
    <div className="rounded-2xl border border-white/8 bg-[#0e1117] overflow-hidden flex flex-col p-4 space-y-4">
        <div className="aspect-[4/3] w-full rounded-xl skeleton" />
        <div className="h-3 w-1/3 rounded-full skeleton" />
        <div className="h-5 w-3/4 rounded-full skeleton" />
        <div className="h-3 w-5/6 rounded-full skeleton" />
        <div className="flex justify-between items-center mt-auto pt-2">
            <div className="h-6 w-20 rounded skeleton" />
            <div className="h-4 w-12 rounded skeleton" />
        </div>
        <div className="flex gap-2 pt-1">
            <div className="h-9 flex-grow rounded-xl skeleton" />
            <div className="h-9 w-9 rounded-xl skeleton" />
        </div>
    </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} />
        ))}
    </div>
);

export const TableRowSkeleton = ({ cols = 4 }) => (
    <tr className="border-b border-white/5">
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="px-5 py-4">
                <div className="h-4 bg-white/10 rounded-full skeleton w-3/4" />
            </td>
        ))}
    </tr>
);

export const StatCardSkeleton = () => (
    <div className="bg-[#0e1117] border border-white/8 rounded-2xl p-6 relative overflow-hidden space-y-4">
        <div className="w-12 h-12 rounded-xl skeleton" />
        <div className="space-y-2">
            <div className="h-3 w-1/3 rounded-full skeleton" />
            <div className="h-7 w-1/2 rounded-full skeleton" />
        </div>
    </div>
);

export const OrderCardSkeleton = () => (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="h-6 w-24 rounded-full skeleton" />
            <div className="h-4 w-32 rounded-full skeleton" />
            <div className="h-5 w-16 rounded skeleton" />
        </div>
        <div className="space-y-2 border-t border-white/5 pt-4">
            <div className="h-12 rounded-xl skeleton w-full" />
            <div className="h-12 rounded-xl skeleton w-full" />
        </div>
    </div>
);

export const DeliveryCardSkeleton = () => (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center">
            <div className="h-7 w-20 rounded-full skeleton" />
            <div className="h-4 w-32 rounded-full skeleton" />
            <div className="h-5 w-6 rounded skeleton" />
        </div>
    </div>
);

export const PDPSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
            <div className="aspect-square rounded-2xl skeleton" />
            <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl skeleton" />
                <div className="w-20 h-20 rounded-xl skeleton" />
                <div className="w-20 h-20 rounded-xl skeleton" />
            </div>
        </div>
        <div className="space-y-6">
            <div className="h-5 w-24 rounded-full skeleton" />
            <div className="h-10 w-3/4 rounded-full skeleton" />
            <div className="h-4 w-1/3 rounded-full skeleton" />
            <div className="h-8 w-1/4 rounded-full skeleton" />
            <div className="space-y-2 pt-4">
                <div className="h-4 w-full rounded-full skeleton" />
                <div className="h-4 w-full rounded-full skeleton" />
                <div className="h-4 w-2/3 rounded-full skeleton" />
            </div>
            <div className="flex gap-3 pt-6">
                <div className="h-12 flex-grow rounded-2xl skeleton" />
                <div className="h-12 w-12 rounded-2xl skeleton" />
                <div className="h-12 w-12 rounded-2xl skeleton" />
            </div>
        </div>
    </div>
);