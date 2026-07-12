import { useState, useRef, useEffect, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import { PlusCircle, MessageSquare, Globe, Book, LogOut, Menu, X, AlertTriangle, Clock } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SUGGESTIONS = [
  "Quels sont les symptômes du paludisme ?",
  "Comment éviter la dengue à la maison ?",
  "Quels aliments privilégier pour un enfant en bas âge ?",
]

// Composant Toast d'erreur (affiché au-dessus du champ de saisie, pas dans le chat)
function ErrorToast({ message, onClose }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(onClose, 200)
    }, 8000) // Auto-fermeture après 8s
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`mx-4 mb-3 max-w-3xl mx-auto ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ maxWidth: '48rem', margin: '0 auto 12px auto', padding: '0 16px' }}
    >
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-4 py-3 shadow-sm">
        <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1 text-sm leading-relaxed">
          {/* Rendre le markdown du message d'erreur lisible */}
          {message.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-1' : ''}>
              {line.replace(/\*\*(.*?)\*\*/g, '$1')}
            </p>
          ))}
        </div>
        <button
          onClick={() => { setExiting(true); setTimeout(onClose, 200) }}
          className="text-amber-400 hover:text-amber-600 transition-colors shrink-0 mt-0.5"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default function ChatWindow() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useWebSearch, setUseWebSearch] = useState(false)
  // Sur mobile : sidebar fermée par défaut pour ne pas prendre tout l'écran
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)
  const [showLogout, setShowLogout] = useState(false)
  const [errorToast, setErrorToast] = useState(null) // { message: string } | null
  const bottomRef = useRef(null)

  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username') || 'Utilisateur'

  const dismissToast = useCallback(() => setErrorToast(null), [])

  useEffect(() => {
    fetchSessions()
    // Fermer la sidebar si on resize vers mobile
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId)
    } else {
      setMessages([])
    }
  }, [activeSessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function fetchSessions() {
    try {
      const res = await fetch(`${API_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        window.location.href = '/login'
        return
      }
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchMessages(sessionId) {
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        window.location.href = '/login'
        return
      }
      if (res.ok) {
        const data = await res.json()
        const formatted = data.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
          sources: []
        }))
        setMessages(formatted)
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function startNewSession() {
    setActiveSessionId(null)
    setMessages([])
    setErrorToast(null)
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  async function sendMessage(text) {
    const userMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setErrorToast(null) // Effacer les anciens toasts

    let currentSessionId = activeSessionId

    try {
      if (!currentSessionId) {
        const sessRes = await fetch(`${API_URL}/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title: text.substring(0, 40) + (text.length > 40 ? '...' : '') })
        })
        if (sessRes.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('username')
          window.location.href = '/login'
          return
        }
        const sessData = await sessRes.json()
        currentSessionId = sessData.id
        setActiveSessionId(currentSessionId)
        fetchSessions()
      }

      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          session_id: currentSessionId,
          use_web_search: useWebSearch
        }),
      })

      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        window.location.href = '/login'
        return
      }

      if (!res.ok) {
        // Extraire le message d'erreur propre du backend
        let friendlyMessage = `Erreur serveur (${res.status}). Veuillez réessayer.`
        try {
          const errData = await res.json()
          if (errData.detail) friendlyMessage = errData.detail
        } catch (e) {}

        // Afficher dans le toast (pas dans le chat)
        setErrorToast({ message: friendlyMessage })
        return // Ne pas ajouter de bulle d'erreur dans le chat
      }

      const data = await res.json()
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources },
      ])
    } catch (err) {
      // Erreur réseau (pas de connexion, backend éteint, etc.)
      setErrorToast({
        message: err.message.includes('fetch')
          ? '🌐 Impossible de contacter le serveur. Vérifiez que le backend est bien démarré.'
          : `Erreur : ${err.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    sendMessage(text)
  }

  return (
    <div className="flex w-full h-full relative">
      {/* Overlay mobile (ferme la sidebar en cliquant à côté) */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        absolute md:relative z-30 h-full bg-white border-r border-clinic-100 flex flex-col transition-all duration-300 overflow-hidden
        ${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:-translate-x-full'}
      `}>
        <div className="p-4 flex items-center justify-between whitespace-nowrap overflow-hidden">
          <span className="font-semibold text-clinic-900">Historique</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-clinic-500 hover:text-clinic-700 p-1"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={startNewSession}
            className="w-full flex items-center gap-2 bg-clinic-50 hover:bg-clinic-100 text-clinic-700 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm whitespace-nowrap overflow-hidden"
          >
            <PlusCircle size={18} />
            Nouvelle conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSessionId(s.id)
                if (window.innerWidth < 768) setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-colors text-left overflow-hidden ${
                activeSessionId === s.id
                  ? 'bg-clinic-500 text-white'
                  : 'hover:bg-clinic-50 text-clinic-700'
              }`}
            >
              <MessageSquare size={16} className="shrink-0" />
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-clinic-100 relative">
          {showLogout && (
            <div className="absolute bottom-full mb-2 left-4 right-4 bg-white border border-clinic-100 shadow-lg rounded-xl overflow-hidden z-50">
              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('username')
                  window.location.href = '/login'
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium transition-colors"
              >
                <LogOut size={16} />
                Se déconnecter
              </button>
            </div>
          )}
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-clinic-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-clinic-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-clinic-900 truncate">{username}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-clinic-50/80 via-white to-clinic-100/30 relative">
        {/* Bouton hamburger flottant (quand sidebar fermée) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 p-2.5 bg-white text-clinic-600 hover:bg-clinic-50 rounded-xl shadow-sm border border-clinic-100 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 bg-clinic-100 text-clinic-600 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare size={32} />
              </div>
              <p className="text-clinic-800 font-medium mb-6 text-lg max-w-sm">
                Bonjour ! Je suis votre assistant de santé. Posez-moi vos questions sur la prévention (paludisme, dengue), la nutrition ou l'orientation vers un centre de santé.
              </p>
              <div className="flex flex-col gap-3 w-full max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                    className="text-sm text-left px-5 py-3.5 rounded-2xl border border-clinic-200 bg-white hover:border-clinic-400 hover:shadow-sm transition-all text-clinic-700 font-medium disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} sources={m.sources} />
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-clinic-100 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                  <span className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-clinic-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-clinic-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-clinic-400 animate-bounce" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Zone de saisie avec toast au-dessus */}
        <div className="bg-white/70 backdrop-blur-xl border-t border-white/60 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.05)] z-10">
          {/* Toast d'erreur — s'affiche juste au-dessus du champ de saisie */}
          {errorToast && (
            <ErrorToast
              message={errorToast.message}
              onClose={dismissToast}
            />
          )}

          <div className="p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3 relative items-center">
              <button
                type="button"
                onClick={() => setUseWebSearch(!useWebSearch)}
                title={useWebSearch ? 'Recherche Web activée — cliquez pour désactiver' : 'Recherche Web désactivée — cliquez pour activer'}
                className={`p-3 rounded-full transition-colors border shrink-0 ${
                  useWebSearch
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-clinic-50 border-clinic-200 text-clinic-400 hover:text-clinic-600'
                }`}
              >
                <Globe size={20} />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Saisir une question..."
                  disabled={loading}
                  className="w-full rounded-full border border-clinic-200/60 bg-white/80 shadow-inner pl-6 pr-24 py-3.5 focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:bg-white transition-all disabled:opacity-60"
                  style={{ fontSize: '16px' }} /* Crucial : empêche le zoom iOS */
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full bg-clinic-600 text-white px-5 text-sm font-medium hover:bg-clinic-700 disabled:opacity-40 transition-colors"
                >
                  {loading ? '...' : 'Envoyer'}
                </button>
              </div>
            </form>
            <p className="text-center text-[11px] text-clinic-400 mt-3">
              L'agent peut faire des erreurs. Vérifiez les informations importantes avec un professionnel de santé.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
