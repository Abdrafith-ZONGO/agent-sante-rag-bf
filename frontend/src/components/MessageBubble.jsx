import SourceBadge from './SourceBadge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MessageBubble({ role, content, sources = [] }) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={
            'rounded-2xl px-5 py-4 leading-relaxed ' +
            (isUser
              ? 'bg-clinic-500 text-white rounded-br-sm text-sm'
              : 'bg-white text-clinic-900 border border-clinic-100 rounded-bl-sm shadow-sm text-sm')
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
          <div className="mt-2 flex flex-wrap gap-1.5 px-1">
            <span className="text-[10px] text-clinic-400 w-full mb-0.5">Sources :</span>
            {sources.map((s, i) => (
              <SourceBadge key={i} source={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
