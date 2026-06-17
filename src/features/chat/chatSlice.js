import { createSlice } from '@reduxjs/toolkit'

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    sessionId: null,
    loading: false,
    error: null,
    isOpen: false,
    suggestions: [],
    moodSuggestions: [],
  },
  reducers: {
    toggleChat(state) {
      state.isOpen = !state.isOpen
    },
    openChat(state) {
      state.isOpen = true
    },
    closeChat(state) {
      state.isOpen = false
    },
    addMessage(state, action) {
      state.messages.push(action.payload)
    },
    setMessages(state, action) {
      state.messages = action.payload
    },
    setSessionId(state, action) {
      state.sessionId = action.payload
    },
    setLoading(state, action) {
      state.loading = action.payload
    },
    setError(state, action) {
      state.error = action.payload
    },
    setSuggestions(state, action) {
      state.suggestions = action.payload
    },
    setMoodSuggestions(state, action) {
      state.moodSuggestions = action.payload
    },
    clearChat(state) {
      state.messages = []
      state.sessionId = null
      state.suggestions = []
      state.moodSuggestions = []
      state.error = null
    },
  },
})

export const {
  toggleChat, openChat, closeChat,
  addMessage, setMessages, setSessionId,
  setLoading, setError, setSuggestions, setMoodSuggestions,
  clearChat,
} = chatSlice.actions

export const selectChat = (state) => state.chat

export default chatSlice.reducer
