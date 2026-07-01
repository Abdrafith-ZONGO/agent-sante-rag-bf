import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import { PlusCircle, MessageSquare, Globe, Book, LogOut, Menu, X, FileText } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SUGGESTIONS = [
  "Quels sont les symptômes du paludisme ?",
  "Comment éviter la dengue à la maison ?",
  "Quels aliments privilégier pour un enfant en bas âge ?",
]

export default function ChatWindow() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useWebSearch, setUseWebSearch] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showLogout, setShowLogout] = useState(false)
  const bottomRef = useRef(null)

  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username') || 'Utilisateur'

  useEffect(() => {
    fetchSessions()
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
      if (res.ok) {
        const data = await res.json()
        // Format to match old state
        const formatted = data.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
          sources: [] // Sources aren't stored in DB in this simple version, but could be
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
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  async function sendMessage(text) {
    const userMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    let currentSessionId = activeSessionId

    try {
      if (!currentSessionId) {
        // Create session
        const sessRes = await fetch(`${API_URL}/sessions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ title: text.substring(0, 30) + "..." })
        })
        const sessData = await sessRes.json()
        currentSessionId = sessData.id
        setActiveSessionId(currentSessionId)
        fetchSessions() // Update sidebar
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

      if (!res.ok) {
        let errorDetail = `Erreur serveur (${res.status})`
        try {
          const errData = await res.json()
          if (errData.detail) errorDetail = errData.detail
        } catch (e) {}
        throw new Error(errorDetail)
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `[Erreur] ${err.message}`,
          sources: [],
        },
      ])
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
      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-20"
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
          <button onClick={() => setSidebarOpen(false)} className="text-clinic-500 hover:text-clinic-700 p-1">
            <Menu size={20} />
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
                activeSessionId === s.id ? 'bg-clinic-500 text-white' : 'hover:bg-clinic-50 text-clinic-700'
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

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-clinic-50/50 relative">
        {/* Floating Menu Button (when sidebar is closed) */}
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 p-2 bg-white text-clinic-600 hover:bg-clinic-50 rounded-lg shadow-sm border border-clinic-100 transition-colors"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 bg-clinic-100 text-clinic-600 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare size={32} />
              </div>
              <p className="text-clinic-800 font-medium mb-6 text-lg max-w-sm">
                Bonjour ! Je suis votre assistant de premier niveau. Posez-moi vos questions sur la prévention (paludisme, dengue), la nutrition ou l'orientation vers un centre de santé.
              </p>
              <div className="flex flex-col gap-3 w-full max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-sm text-left px-5 py-3.5 rounded-2xl border border-clinic-200 bg-white hover:border-clinic-400 hover:shadow-sm transition-all text-clinic-700 font-medium"
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
                  <span className="flex gap-1.5">
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

        <div className="bg-white border-t border-clinic-100 p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3 relative items-center">
            <button
              type="button"
              onClick={() => setUseWebSearch(!useWebSearch)}
              title={useWebSearch ? "Recherche Web activée" : "Recherche Web désactivée"}
              className={`p-3 rounded-full transition-colors border ${useWebSearch ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-clinic-50 border-clinic-200 text-clinic-400 hover:text-clinic-600'}`}
            >
              <Globe size={20} />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Saisir une question..."
                className="w-full rounded-full border border-clinic-200 bg-clinic-50/50 pl-6 pr-24 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full bg-clinic-600 text-white px-5 text-sm font-medium hover:bg-clinic-700 disabled:opacity-40 transition-colors"
              >
                Envoyer
              </button>
            </div>
          </form>
          <p className="text-center text-[11px] text-clinic-400 mt-3">
            L'agent peut faire des erreurs. Vérifiez les informations importantes avec un professionnel de santé.
          </p>
        </div>
      </div>
    </div>
  )
}
