// src/components/SearchModal.jsx
import React, { useState, useEffect } from 'react';
import { CaretLeft, MagnifyingGlass, NavigationArrow, MapPin, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';


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
    const { theme } = useTheme();


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
                className={`fixed inset-0 z-[100] flex flex-col font-satoshi transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-950'
                }`}
            >

                {/* HEADER */}
                <div className={`flex items-center gap-3 px-4 pt-12 pb-4 border-b ${
                    theme === 'dark' ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-100'
                }`}>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${
                        theme === 'dark' ? 'text-white active:bg-white/10' : 'text-zinc-950 active:bg-zinc-100'
                    }`}>
                        <CaretLeft size={28} weight="bold" />
                    </button>


                    <div className="flex-1 relative">
                        <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" weight="bold" />
                        <input
                            type="text"
                            placeholder="Trova luoghi e cose da fare"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full rounded-full py-3 pl-10 pr-10 text-sm focus:outline-none font-geist transition-colors ${
                                theme === 'dark' 
                                    ? 'bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:border-zinc-700' 
                                    : 'bg-zinc-100 border border-transparent text-zinc-950 placeholder-zinc-400 focus:bg-zinc-50 focus:border-zinc-200'
                            }`}
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
                            <li className={`flex items-center gap-4 py-4 border-b transition-colors cursor-pointer ${
                                theme === 'dark' ? 'border-white/5 active:bg-white/5' : 'border-zinc-100 active:bg-zinc-50'
                            }`} onClick={() => handleCityClick({ id: 'nearby' })}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                    theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'
                                }`}>
                                    <NavigationArrow size={24} className="text-blue-400" weight="regular" />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`font-bold text-[16px] leading-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Vicino a te</span>
                                    <span className="text-zinc-400 text-[13px] font-geist mt-0.5">Attività vicino alla tua posizione attuale</span>
                                </div>
                            </li>


                            {/* CITIES */}
                            {PUGIA_CITIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((city, idx) => (
                                <li
                                    key={city.id}
                                    className={`flex items-center gap-4 py-4 transition-colors cursor-pointer ${
                                        idx !== PUGIA_CITIES.length - 1 
                                            ? (theme === 'dark' ? 'border-b border-white/5' : 'border-b border-zinc-100') 
                                            : ''
                                    } ${theme === 'dark' ? 'active:bg-white/5' : 'active:bg-zinc-50'}`}
                                    onClick={() => handleCityClick(city)}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                        theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'
                                    }`}>
                                        <MapPin size={24} className={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-500'} weight="regular" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`font-medium text-[16px] leading-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{city.name}</span>
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
