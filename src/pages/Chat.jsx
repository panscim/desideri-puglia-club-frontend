// src/pages/Chat.jsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Send, Heart, Users, Sparkles, Flame, Smile, Lock, MapPin, MessageCircle } from 'lucide-react'
import { getLevelByPoints, getProgressToNextLevel } from '../utils/levels'
import toast from 'react-hot-toast'

const RATE_LIMIT_MS = 15 * 1000 // 15 secondi
const TTL_HOURS = 24 // messaggi visibili per 24h
const REACTIONS = ['🔥', '😍', '😂', '🍷']

// --- SKELETON UI ---
const ChatSkeleton = () => (
  <div className="space-y-6 p-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex flex-col gap-2 max-w-[70%] ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center gap-2">
            {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-sand/30 animate-pulse" />}
            <div className="h-4 w-24 bg-sand/30 rounded animate-pulse" />
          </div>
          <div className={`h-16 w-full rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-olive-dark/10' : 'bg-sand/20'}`} style={{ width: Math.random() * 100 + 150 + 'px' }} />
        </div>
      </div>
    ))}
  </div>
)

const Chat = () => {
  const { profile } = useAuth()
  
  // Data State
  const [messages, setMessages] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Interaction State
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [lastSentAt, setLastSentAt] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Refs
  const messagesEndRef = useRef(null)
  const changesChannelRef = useRef(null)
  const presenceChannelRef = useRef(null)
  const subscribedRef = useRef(false)

  // --- LIVELLO & LOGICA BLOCCO ---
  const totalPoints = profile?.punti_totali || 0
  const currentLevel = getLevelByPoints(totalPoints)
  const { percentage: xpPercentage, pointsNeeded } = getProgressToNextLevel(totalPoints)
  const isChatUnlocked = currentLevel.id >= 2

  // Rate Limit Check
  const now = Date.now()
  const remainingMs = Math.max(0, RATE_LIMIT_MS - (now - lastSentAt))
  const remainingSec = Math.ceil(remainingMs / 1000)

  // --- INIT & REALTIME ---
  const getCutoffISO = () => new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000).toISOString()

  useEffect(() => {
    loadMessages()

    if (!subscribedRef.current) {
      subscribedRef.current = true

      // 1. Canale Messaggi (Insert/Update)
      const changesChannel = supabase
        .channel('chat-messages')
        .on('postgres_changes', { schema: 'public', table: 'messaggi_chat', event: 'INSERT' }, async (payload) => {
           if (new Date(payload.new.data_invio) < new Date(getCutoffISO())) return
           const { data } = await supabase.from('messaggi_chat').select(`*, utenti:id_utente(nickname, livello, punti_totali, avatar_url)`).eq('id', payload.new.id).single()
           if (data) setMessages(prev => [...prev, data])
        })
        .on('postgres_changes', { schema: 'public', table: 'messaggi_chat', event: 'UPDATE' }, () => loadMessages())
        .subscribe()
      changesChannelRef.current = changesChannel

      // 2. Canale Presence (Online Users)
      const presenceChannel = supabase.channel('chat-presence', { config: { presence: { key: String(profile?.id || `anon-${Date.now()}`) } } })
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState()
          const users = Object.values(state).flat().filter(Boolean)
          const byId = new Map(); users.forEach(u => byId.set(u.user_id, u))
          setOnlineUsers(Array.from(byId.values()))
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ user_id: profile?.id || 'anon', nickname: profile?.nickname || 'Ospite', avatar_url: profile?.avatar_url })
          }
        })
      presenceChannelRef.current = presenceChannel
    }

    return () => {
      if (changesChannelRef.current) supabase.removeChannel(changesChannelRef.current)
      if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current)
    }
  }, [profile?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messaggi_chat')
        .select(`*, utenti:id_utente(nickname, livello, punti_totali, avatar_url)`)
        .gte('data_invio', getCutoffISO())
        .order('data_invio', { ascending: true })
        .limit(200)
      if (!error) setMessages(data || [])
    } catch (err) { console.error(err) } 
    finally { setLoading(false) }
  }

  // --- ACTIONS ---
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (sending || !isChatUnlocked) return
    const text = newMessage.trim()
    if (!text) return

    if (!profile?.id) return toast.error('Devi essere loggato.')
    
    // Rate Limit Client Side
    if (Date.now() - lastSentAt < RATE_LIMIT_MS) {
       return toast.error(`Aspetta ancora qualche secondo... 🧘`)
    }

    setSending(true)
    // Normalizzazione testo comando
    let finalMsg = text
    if (text.startsWith('/consiglio')) {
       const content = text.replace('/consiglio', '').trim()
       finalMsg = content ? `🧭 RICHIESTA CONSIGLIO: ${content}` : `🧭 RICHIESTA CONSIGLIO: Qualcuno ha suggerimenti sulla zona?`
    }

    try {
      const { error } = await supabase.from('messaggi_chat').insert([{ id_utente: profile.id, messaggio: finalMsg, like_count: 0 }])
      if (error) throw error
      setNewMessage('')
      setLastSentAt(Date.now())
      setShowEmojiPicker(false)
    } catch { toast.error("Errore invio.") } 
    finally { setSending(false) }
  }

  const handleReaction = async (msgId, currentReactions, emoji) => {
    const base = currentReactions || {}
    const newReactions = { ...base, [emoji]: (base[emoji] || 0) + 1 }
    await supabase.from('messaggi_chat').update({ reactions: newReactions }).eq('id', msgId)
  }

  // --- RENDER HELPERS ---
  const formatTime = (iso) => new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  
  // Raggruppamento per giorni
  const groupedMessages = []
  let lastDate = ''
  messages.forEach(msg => {
     const dateKey = new Date(msg.data_invio).toDateString()
     if (dateKey !== lastDate) {
        groupedMessages.push({ type: 'separator', date: dateKey })
        lastDate = dateKey
     }
     groupedMessages.push({ type: 'msg', ...msg })
  })

  return (
    <div className="relative max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      
      {/* 1. HEADER ELEGANTE */}
      <div className="bg-white/80 backdrop-blur-md border-b border-sand px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-olive-dark flex items-center gap-2">
            Club Lounge
            <span className="flex h-2 w-2 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </h1>
          <p className="text-xs text-olive-light flex items-center gap-1">
             <Users className="w-3 h-3" /> {onlineUsers.length} membri online
          </p>
        </div>
        {profile && (
           <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-olive-dark">{profile.nickname}</p>
              <p className="text-[10px] text-olive-light uppercase tracking-wider">{currentLevel.name}</p>
           </div>
        )}
      </div>

      {/* 2. AREA MESSAGGI */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {loading ? <ChatSkeleton /> : groupedMessages.length > 0 ? (
          <>
            {groupedMessages.map((item, idx) => {
              if (item.type === 'separator') {
                 // DATA SEPARATOR
                 const isToday = new Date(item.date).toDateString() === new Date().toDateString()
                 return (
                    <div key={`sep-${idx}`} className="flex justify-center py-2">
                       <span className="px-3 py-1 rounded-full bg-sand/30 text-[10px] font-bold text-olive-light uppercase tracking-widest">
                          {isToday ? 'Oggi' : new Date(item.date).toLocaleDateString('it-IT', { day:'numeric', month:'short' })}
                       </span>
                    </div>
                 )
              }

              // MESSAGGIO
              const isMe = item.id_utente === profile?.id
              const isAdvice = item.messaggio.startsWith('🧭')
              const u = item.utenti || {}
              
              return (
                <div key={item.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}>
                  {/* AVATAR */}
                  {!isMe && (
                    <div className="flex-shrink-0 self-end mb-1">
                       <img src={u.avatar_url || '/logo.png'} alt={u.nickname} className="w-8 h-8 rounded-full bg-sand object-cover border border-white shadow-sm" />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* NOME (Solo altri) */}
                    {!isMe && (
                       <span className="text-[10px] text-olive-light ml-1 mb-0.5 flex items-center gap-1">
                          {u.nickname} • {u.livello}
                       </span>
                    )}

                    {/* BUBBLE */}
                    <div className={`relative px-4 py-2.5 shadow-sm text-sm leading-relaxed break-words
                       ${isAdvice ? 'border border-gold bg-amber-50 text-olive-dark' : ''}
                       ${isMe 
                         ? 'bg-olive-dark text-white rounded-2xl rounded-tr-sm' 
                         : 'bg-white text-olive-dark border border-sand rounded-2xl rounded-tl-sm'
                       }
                    `}>
                       {item.messaggio}
                    </div>

                    {/* FOOTER MESSAGGIO (Ora + Reazioni) */}
                    <div className="flex items-center gap-2 mt-1 px-1">
                       <span className="text-[10px] text-olive-light/60">{formatTime(item.data_invio)}</span>
                       
                       {/* REAZIONI */}
                       <div className="flex gap-1">
                          {REACTIONS.map(emoji => {
                             const count = item.reactions?.[emoji] || 0
                             if (count === 0 && isMe) return null // Nascondi reazioni vuote sui miei msg
                             return (
                                <button 
                                   key={emoji}
                                   onClick={() => handleReaction(item.id, item.reactions, emoji)}
                                   className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors border ${
                                      count > 0 
                                      ? 'bg-white border-sand text-olive-dark shadow-sm' 
                                      : 'border-transparent text-olive-light/50 hover:bg-sand/30'
                                   }`}
                                >
                                   {emoji} {count > 0 && <span className="font-bold ml-0.5">{count}</span>}
                                </button>
                             )
                          })}
                       </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-olive-light opacity-60">
             <MessageCircle className="w-12 h-12 mb-2 stroke-1" />
             <p className="text-sm">Il salotto è tranquillo oggi.</p>
             <p className="text-xs">Inizia tu la conversazione.</p>
          </div>
        )}
      </div>

      {/* 3. INPUT AREA (Sticky Bottom) */}
      <div className="bg-white px-4 py-3 border-t border-sand pb-6 sm:pb-3">
         <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 max-w-4xl mx-auto">
            
            {/* Emoji Trigger */}
            <button 
               type="button" 
               onClick={() => setShowEmojiPicker(!showEmojiPicker)}
               disabled={!isChatUnlocked}
               className="p-3 rounded-full text-olive-light hover:bg-sand/30 transition-colors disabled:opacity-30"
            >
               <Smile className="w-6 h-6" />
            </button>

            {/* Input Field */}
            <div className="flex-1 relative">
               <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={!isChatUnlocked || sending}
                  placeholder={isChatUnlocked ? "Scrivi un pensiero..." : "Chat bloccata"}
                  className="w-full bg-sand/20 border-0 rounded-2xl py-3 pl-4 pr-12 text-olive-dark placeholder:text-olive-light/60 focus:ring-2 focus:ring-olive-dark/10 transition-all disabled:opacity-50"
               />
               {/* Quick Actions (Hint) */}
               {isChatUnlocked && newMessage.length === 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-olive-light/50 pointer-events-none hidden sm:block">
                     Prova /consiglio
                  </div>
               )}
            </div>

            {/* Send Button */}
            <button 
               type="submit" 
               disabled={!newMessage.trim() || sending || !isChatUnlocked}
               className="p-3 rounded-full bg-olive-dark text-white hover:bg-gold hover:text-black shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none active:scale-90"
            >
               <Send className="w-5 h-5 ml-0.5" />
            </button>

            {/* EMOJI POPUP */}
            {showEmojiPicker && isChatUnlocked && (
               <div className="absolute bottom-16 left-0 bg-white border border-sand rounded-2xl shadow-xl p-3 flex gap-2 animate-in slide-in-from-bottom-2 z-20">
                  {['😀', '😂', '😍', '🔥', '🍷', '🍝', '🌊', '🙏'].map(em => (
                     <button key={em} type="button" onClick={() => setNewMessage(p => p + em)} className="text-2xl hover:scale-125 transition-transform p-1">
                        {em}
                     </button>
                  ))}
               </div>
            )}
         </form>
         
         {/* Rate Limit Info */}
         {remainingSec > 0 && (
            <p className="text-[10px] text-center text-olive-light mt-1 animate-pulse">
               🧘 Calma... attendi {remainingSec}s
            </p>
         )}
      </div>


      {/* 🔒 LOCKED OVERLAY (Cinematic) */}
      {!isChatUnlocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
           {/* Background Blurred Content */}
           <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />
           
           {/* Card */}
           <div className="relative w-full max-w-md bg-olive-dark text-sand rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
              {/* Video Background */}
              <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                 <video src="/video/fumo.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
              </div>
              
              <div className="relative p-8 text-center space-y-6">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-2">
                    <Lock className="w-5 h-5 text-gold" />
                 </div>

                 <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Club Lounge</h2>
                    <p className="text-sm text-sand/80 leading-relaxed">
                       Un luogo esclusivo per i viaggiatori esperti. 
                       Scambia consigli, organizza incontri e scopri i segreti della Puglia.
                    </p>
                 </div>

                 {/* Progress Bar */}
                 <div className="bg-black/30 rounded-xl p-4 border border-white/10 text-left space-y-3">
                    <div className="flex justify-between text-xs text-sand/60 font-medium uppercase tracking-wider">
                       <span>Livello Attuale</span>
                       <span>Obiettivo</span>
                    </div>
                    
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                       <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold to-amber-500 transition-all duration-1000" style={{ width: `${Math.max(5, xpPercentage)}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                       <span className="text-white font-mono">{totalPoints} XP</span>
                       <span className="text-gold font-bold">Livello 2 Richiesto</span>
                    </div>
                 </div>

                 <Link to="/missioni" className="block w-full py-3.5 rounded-xl bg-gold text-black font-bold text-sm hover:bg-white transition-colors shadow-lg shadow-gold/20">
                    Completa Missioni per Accedere
                 </Link>
              </div>
           </div>
        </div>
      )}

    </div>
  )
}

export default Chat