import React, { useRef } from 'react';
import { Image, X, Upload } from 'lucide-react';

// Converts file to base64 string
const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const ImageUpload = ({ value, onChange, label = 'Product Image' }) => {
    const inputRef = useRef();

    const handleFile = async (file) => {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return; }
        const base64 = await toBase64(file);
        onChange(base64);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleFile(file);
    };

    return (
        <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">{label}</label>
            {value ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                    <img src={value} alt="Product" className="w-full h-40 object-cover" />
                    <button type="button" onClick={() => onChange(null)}
                        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <X className="w-3.5 h-3.5 text-white" />
                    </button>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => inputRef.current.click()}
                    className="border-2 border-dashed border-white/10 hover:border-cyan-500/40 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-cyan-500/5">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-white/20" />
                    <p className="text-sm text-white/30 font-semibold">Click or drag image here</p>
                    <p className="text-xs text-white/15 mt-1">PNG, JPG up to 2MB</p>
                </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
        </div>
    );
};

export default ImageUpload;