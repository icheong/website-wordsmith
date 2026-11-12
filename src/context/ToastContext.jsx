import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

/** Minimal transient feedback (bottom-center pill, auto-dismiss). */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const notify = useCallback((message, tone = 'default') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, tone, key: Date.now() })
    timerRef.current = setTimeout(() => setToast(null), 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {toast && (
        <div
          key={toast.key}
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-ink/10 bg-ink px-4 py-2 text-sm text-paper shadow-sm"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
