import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../../features/auth/authSlice'
import { setStoredUser } from '../../services/apiClient'
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

    localStorage.setItem('token', trimmed)
    dispatch(setToken(trimmed))

    const userData = {
      _id: payload.id || payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name || payload.email?.split('@')[0] || 'User',
    }
    setStoredUser(userData)

    setStatus('success')
    setDecoded(payload)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-lg w-full border border-gray-700 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-indigo-400" size={28} />
          <h1 className="text-xl font-bold text-white">Developer Token Injector</h1>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Paste a JWT token below to authenticate as a user for testing order & payment flow.
        </p>

        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setStatus(null); }}
          placeholder="eyJhbGciOiJIUzI1NiIs..."
          rows={4}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 text-xs font-mono placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
        />

        <button
          onClick={handleInject}
          disabled={!input.trim()}
          className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Inject Token <ArrowRight size={18} />
        </button>

        {status === 'success' && (
          <div className="mt-4 p-4 bg-green-900/50 border border-green-700 rounded-lg">
            <div className="flex items-center gap-2 text-green-400 font-semibold mb-2">
              <CheckCircle2 size={18} /> Token Injected Successfully
            </div>
            {decoded && (
              <div className="text-xs text-green-300 space-y-1 font-mono">
                <p>User ID: {decoded.id || decoded.sub}</p>
                <p>Email: {decoded.email}</p>
                <p>Role: {decoded.role}</p>
                <p>Expires: {new Date((decoded.exp || 0) * 1000).toLocaleTimeString()}</p>
              </div>
            )}
            <button
              onClick={() => navigate('/checkout')}
              className="mt-3 w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition"
            >
              Go to Checkout
            </button>
          </div>
        )}

        {status === 'invalid' && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-400">
            <XCircle size={18} /> Invalid JWT token format
          </div>
        )}

        {status === 'expired' && (
          <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-2">
              <XCircle size={18} /> Token Expired
            </div>
            <p className="text-xs text-yellow-300">This token expired at {new Date((decoded?.exp || 0) * 1000).toLocaleString()}. Get a fresh token and try again.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DevToken
