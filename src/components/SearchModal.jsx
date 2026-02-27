// src/components/SearchModal.jsx
import React, { useState, useEffect } from 'react';
import { CaretLeft, MagnifyingGlass, NavigationArrow, MapPin, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PUGIA_CITIES = [
    { id: 'bari', name: 'Comune di Bari', area: 'Città, Italia', filterName: 'Bari' },
    { id: 'trani', name: 'Comune di Trani', area: 'Città, Italia', filterName: 'Trani' },
    { id: 'barletta', name: 'Comune di Barletta', area: 'Città, Italia', filterName: 'Barletta' },
    { id: 'andria', name: 'Comune di Andria', area: 'Città, Italia', filterName: 'Andria' },
    { id: 'monte_sant_angelo', name: "Monte Sant'Angelo", area: 'Città, Italia', filterName: "Monte Sant'Angelo" },
    { id: 'molfetta', name: 'Molfetta', area: 'Città, Italia', filterName: 'Molfetta' },
    { id: 'manfredonia', name: 'Manfredonia', area: 'Città, Italia', filterName: 'Manfredonia' },
    { id: 'giovinazzo', name: 'Giovinazzo', area: 'Città, Italia', filterName: 'Giovinazzo' },
    { id: 'bitonto', name: 'Bitonto', area: 'Città, Italia', filterName: 'Bitonto' },
    { id: 'bisceglie', name: 'Bisceglie', area: 'Città, Italia', filterName: 'Bisceglie' },
];

const SearchModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    // Reset state when modal is opened/closed
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            // Lock body scroll
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCityClick = (city) => {
        onClose();
        if (city.id === 'nearby') {
            navigate('/missioni');
        } else {
            navigate(`/missioni?city=${encodeURIComponent(city.filterName)}`);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col font-satoshi text-white"
            >
                {/* HEADER */}
                <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-zinc-950 border-b border-white/5">
                    <button onClick={onClose} className="p-2 text-white active:bg-white/10 rounded-full transition-colors">
                        <CaretLeft size={28} weight="bold" />
                    </button>

                    <div className="flex-1 relative">
                        <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" weight="bold" />
                        <input
                            type="text"
                            placeholder="Trova luoghi e cose da fare"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-full py-3 pl-10 pr-10 text-sm focus:outline-none focus:border-zinc-700 text-white placeholder-zinc-500 font-geist"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                            >
                                <X size={16} weight="bold" />
                            </button>
                        )}
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-10">

                    {/* CITY SELECTION LIST */}
                    <div className="px-4 py-6">
                        <h2 className="text-[20px] font-bold text-white mb-4">Suggerimenti</h2>

                        <ul className="flex flex-col">
                            {/* VICINO A TE */}
                            <li className="flex items-center gap-4 py-4 border-b border-white/5 active:bg-white/5 transition-colors cursor-pointer" onClick={() => handleCityClick({ id: 'nearby' })}>
                                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                                    <NavigationArrow size={24} className="text-blue-400" weight="regular" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-[16px] leading-tight">Vicino a te</span>
                                    <span className="text-zinc-400 text-[13px] font-geist mt-0.5">Attività vicino alla tua posizione attuale</span>
                                </div>
                            </li>

                            {/* CITIES */}
                            {PUGIA_CITIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((city, idx) => (
                                <li
                                    key={city.id}
                                    className={`flex items-center gap-4 py-4 ${idx !== PUGIA_CITIES.length - 1 ? 'border-b border-white/5' : ''} active:bg-white/5 transition-colors cursor-pointer`}
                                    onClick={() => handleCityClick(city)}
                                >
                                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin size={24} className="text-zinc-300" weight="regular" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium text-[16px] leading-tight">{city.name}</span>
                                        <span className="text-zinc-400 text-[13px] font-geist mt-0.5">{city.area}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SearchModal;
