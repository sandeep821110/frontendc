import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, X, Send, Sparkles, Loader2, ShoppingBag } from 'lucide-react'
import {
  selectChat, addMessage, setSessionId,
  setLoading, setError, setSuggestions, setMoodSuggestions,
  toggleChat, clearChat,
} from '../../features/chat/chatSlice'
import { sendMessage } from '../../services/chatAPI'

const QuickReplies = [
  'Show me bestsellers',
  'I need a party outfit',
  'Budget under ₹2000',
  "What's trending?",
  'Suggest for my body type',
]

const ProductCard = ({ product, onClick }) => (
  <div
    onClick={() => onClick(product.id)}
    className="flex gap-3 bg-white border border-gray-200 rounded-xl p-2.5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
  >
    <img
      src={product.image}
      alt={product.name}
      className="w-16 h-16 object-cover rounded-lg bg-gray-100 flex-shrink-0"
      onError={(e) => { e.target.style.display = 'none' }}
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
      <p className="text-xs text-gray-500">{product.brand} &middot; {product.category}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm font-bold text-gray-900">₹{product.discountPrice?.toLocaleString() || product.price?.toLocaleString()}</span>
        {product.discountPrice < product.price && (
          <span className="text-xs text-gray-400 line-through">₹{product.price?.toLocaleString()}</span>
        )}
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-yellow-500 text-xs">{'★'.repeat(Math.round(product.rating || 0))}</span>
        <span className="text-[10px] text-gray-400">({product.rating})</span>
      </div>
    </div>
  </div>
)

const ChatWidget = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { messages, sessionId, loading, isOpen, suggestions } = useSelector(selectChat)
  const [input, setInput] = useState('')
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [lastProducts, setLastProducts] = useState([])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleSend = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setShowQuickReplies(false)
    setLastProducts([])

    dispatch(addMessage({ role: 'user', content: msg }))
    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const res = await sendMessage(msg, sessionId)
      if (res.success && res.data) {
        if (res.data.sessionId && res.data.sessionId !== sessionId) {
          dispatch(setSessionId(res.data.sessionId))
        }
        dispatch(addMessage({ role: 'assistant', content: res.data.text }))
        if (res.data.products?.length > 0) {
          setLastProducts(res.data.products)
        }
        if (res.data.suggestions) dispatch(setSuggestions(res.data.suggestions))
        if (res.data.mood_suggestions) dispatch(setMoodSuggestions(res.data.mood_suggestions))
      }
    } catch (err) {
      dispatch(setError('Sorry, something went wrong. Please try again.'))
      dispatch(addMessage({ role: 'assistant', content: 'Sorry, I ran into an issue. Could you try asking again?' }))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (suggestion) => {
    handleSend(suggestion)
  }

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`)
    dispatch(toggleChat())
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => dispatch(toggleChat())}
          className="fixed bottom-6 right-6 z-[9999] bg-black text-white p-4 rounded-full shadow-2xl hover:bg-gray-800 transition-all hover:scale-110 active:scale-95"
          aria-label="Open chat"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          <div className="bg-black text-white px-5 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400/20 p-2 rounded-lg">
                <Sparkles size={20} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">ChooseMood AI</h3>
                <p className="text-[11px] text-gray-400">Fashion Assistant &middot; Online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { dispatch(clearChat()); setLastProducts([]); setShowQuickReplies(true) }}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-800 transition"
                title="New chat"
              >
                New
              </button>
              <button
                onClick={() => dispatch(toggleChat())}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-10 px-4">
                <div className="bg-yellow-400/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} className="text-yellow-500" />
                </div>
                <p className="text-gray-800 text-sm font-semibold">Hi! I'm your fashion assistant</p>
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                  Ask me for outfit ideas, product recommendations, or style advice!
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div
                  className={`max-w-[88%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-black text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {lastProducts.length > 0 && !loading && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium px-1">
                  <ShoppingBag size={14} />
                  <span>Recommended for you</span>
                </div>
                <div className="space-y-2">
                  {lastProducts.slice(0, 4).map((p) => (
                    <ProductCard key={p.id} product={p} onClick={handleProductClick} />
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3.5 shadow-sm border border-gray-100 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {showQuickReplies && messages.length === 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-2">
                {QuickReplies.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => handleSuggestion(qr)}
                    className="text-xs bg-white border border-gray-200 rounded-full px-3.5 py-2 text-gray-600 hover:bg-black hover:text-white hover:border-black transition shadow-sm"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {suggestions.length > 0 && !loading && messages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 pt-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="text-xs bg-white border border-gray-200 rounded-full px-3.5 py-2 text-gray-600 hover:bg-black hover:text-white hover:border-black transition shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-3 bg-white rounded-b-2xl flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about fashion..."
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-gray-300 placeholder-gray-400"
                disabled={loading}
                maxLength={500}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="bg-black text-white p-2.5 rounded-full hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatWidget
