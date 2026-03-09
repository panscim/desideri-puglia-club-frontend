import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CaretLeft, 
  CheckCircle, 
  Clock, 
  Info, 
  WarningCircle, 
  Target,
  Gift,
  Trash
} from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService } from '../services/notifications';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const Notifiche = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    loadNotifications();
  }, [profile?.id]);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await NotificationService.getUserNotifications(profile.id);
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAllRead = async () => {
    await NotificationService.markAllAsRead(profile.id);
    setNotifications(prev => prev.map(n => ({ ...n, letta: true })));
  };

  const handleMarkRead = async (id) => {
    await NotificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, letta: true } : n));
  };

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'missione': return <Target size={20} weight="fill" className="text-teal-600" />;
      case 'premio': return <Gift size={20} weight="fill" className="text-gold" />;
      case 'avviso': return <WarningCircle size={20} weight="fill" className="text-orange-600" />;
      default: return <Info size={20} weight="fill" className="text-navy" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF5] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FDFAF5]/95 backdrop-blur-md px-5 pt-14 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-[#EAE3D6] flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <CaretLeft size={20} weight="bold" className="text-[#16243E]" />
          </button>
          <h1 className="font-serif font-black text-[#16243E] text-[24px]">Centro Notifiche</h1>
          <button 
            onClick={handleMarkAllRead}
            disabled={!notifications.some(n => !n.letta)}
            className="text-[12px] font-bold text-[#D4693A] uppercase tracking-wider disabled:opacity-30"
          >
            Svuota
          </button>
        </div>
      </header>

      <main className="px-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-20">
            <div className="w-12 h-12 border-4 border-[#16243E]/10 border-t-[#16243E] rounded-full animate-spin mb-4" />
            <p className="text-[#8A95AD] text-[14px] font-medium">Recupero avvisi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="w-[80px] h-[80px] bg-white border border-[#EAE3D6] rounded-[28px] flex items-center justify-center mb-6 shadow-soft">
              <Bell size={32} weight="duotone" className="text-[#8A95AD]" />
            </div>
            <h2 className="font-serif text-[20px] font-black text-[#16243E] mb-2">Tutto tranquillo!</h2>
            <p className="text-[#8A95AD] text-[14px] leading-relaxed max-w-[240px]">
              Non ci sono nuove notifiche al momento. Ti avviseremo appena succede qualcosa di eccitante.
            </p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <AnimatePresence>
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  variants={itemVariants}
                  layout
                  onClick={() => !notif.letta && handleMarkRead(notif.id)}
                  className={`
                    relative p-4 rounded-[22px] border transition-all duration-300 active:scale-[0.98] cursor-pointer
                    ${notif.letta 
                      ? 'bg-transparent border-[#EAE3D6]/50 opacity-60' 
                      : 'bg-white border-[#EAE3D6] shadow-sm'}
                  `}
                >
                  <div className="flex gap-4">
                    <div className={`
                      w-11 h-11 rounded-[14px] shrink-0 flex items-center justify-center
                      ${notif.letta ? 'bg-[#F7F1E8]' : 'bg-[#16243E]/5'}
                    `}>
                      {getIcon(notif.tipo)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`text-[15px] font-bold leading-tight truncate ${notif.letta ? 'text-[#16243E]' : 'text-[#16243E]'}`}>
                          {notif.titolo}
                        </h3>
                        {!notif.letta && (
                          <span className="w-2 h-2 bg-[#D4693A] rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[13px] text-[#8A95AD] leading-relaxed mb-2">
                        {notif.messaggio}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8A95AD]/60">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: it })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="pt-10 pb-10 text-center">
            <p className="text-[11px] font-bold text-[#8A95AD]/40 uppercase tracking-[0.2em]">
                Fine degli avvisi
            </p>
        </div>
      </main>
    </div>
  );
};

export default Notifiche;
