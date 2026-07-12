import SourceBadge from './SourceBadge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MessageBubble({ role, content, sources = [] }) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group mb-2`}>
      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? 'order-2' : 'order-1'} transition-transform duration-300 ease-out hover:scale-[1.01]`}>
        <div
          className={
            'px-5 py-4 leading-relaxed shadow-sm ' +
            (isUser
              ? 'bg-gradient-to-br from-clinic-500 to-clinic-600 text-white rounded-3xl rounded-br-sm text-sm'
              : 'bg-white/80 backdrop-blur-md text-clinic-900 border border-white/60 rounded-3xl rounded-bl-sm text-sm shadow-[0_4px_15px_-10px_rgba(0,0,0,0.05)]')
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-clinic-50 prose-pre:text-clinic-900 prose-strong:text-clinic-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 px-2 opacity-80 transition-opacity duration-300 group-hover:opacity-100">
            <span className="text-[10px] font-semibold text-clinic-400 w-full mb-0.5 uppercase tracking-wider">Sources vérifiées :</span>
            {sources.map((s, i) => (
              <SourceBadge key={i} source={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
