import { Globe, FileText } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function SourceBadge({ source }) {
  if (typeof source === 'string') {
     // Fallback for old messages
     return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border bg-slate-100 text-slate-700">{source}</span>
  }

  const isWeb = source.type === 'web'
  const cleanName = source.name.trim().replace(/_/g, ' ').replace('.pdf', '')
  const href = isWeb ? source.url : `${API_URL}${source.url}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors hover:shadow-sm ' +
        (isWeb
          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20'
          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20')
      }
    >
      {isWeb ? <Globe size={12} /> : <FileText size={12} />}
      {cleanName}
    </a>
  )
}
