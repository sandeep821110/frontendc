import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../../features/auth/authSlice'
import { Shield, Loader2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'

const DevToken = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [status, setStatus] = useState(null)
  const [decoded, setDecoded] = useState(null)

  const parseJwt = (token) => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      return JSON.parse(atob(parts[1]))
    } catch {
      return null
    }
  }

  const handleInject = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const payload = parseJwt(trimmed)
    if (!payload) {
      setStatus('invalid')
      return
    }

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      setStatus('expired')
      setDecoded(payload)
      return
    }

    dispatch(setToken(trimmed))

    setStatus('success')
    setDecoded(payload)
  }

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-rose-300/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl" />

      <div className="relative bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-pink-200/60 ring-1 ring-pink-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-pink-700 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
            <Shield size={24} />
          </div>
          <h1 className="text-xl font-extrabold gradient-text">Developer Token Injector</h1>
        </div>

        <p className="text-gray-500 text-sm mb-4">
          Paste a JWT token below to authenticate as a user for testing order &amp; payment flow.
        </p>

        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setStatus(null); }}
          placeholder="eyJhbGciOiJIUzI1NiIs..."
          rows={4}
          className="input font-mono text-xs resize-none bg-gray-50/60 focus:bg-white"
        />

        <button
          onClick={handleInject}
          disabled={!input.trim()}
          className="btn-gradient w-full !py-3.5 !text-base mt-4"
        >
          Inject Token <ArrowRight size={18} />
        </button>

        {status === 'success' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
              <CheckCircle2 size={18} /> Token Injected Successfully
            </div>
            {decoded && (
              <div className="text-xs text-green-700 space-y-1 font-mono">
                <p>User ID: {decoded.id || decoded.sub}</p>
                <p>Email: {decoded.email}</p>
                <p>Role: {decoded.role}</p>
                <p>Expires: {new Date((decoded.exp || 0) * 1000).toLocaleTimeString()}</p>
              </div>
            )}
            <button
              onClick={() => navigate('/checkout')}
              className="btn-gradient w-full !py-2.5 mt-3"
            >
              Go to Checkout
            </button>
          </div>
        )}

        {status === 'invalid' && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700">
            <XCircle size={18} /> Invalid JWT token format
          </div>
        )}

        {status === 'expired' && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
              <XCircle size={18} /> Token Expired
            </div>
            <p className="text-xs text-amber-700">This token expired at {new Date((decoded?.exp || 0) * 1000).toLocaleString()}. Get a fresh token and try again.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DevToken
