import { useEffect } from 'react'

function Toast({ toast, onDismiss, durationMs = 2600 }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => onDismiss(), durationMs)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss, durationMs])

  if (!toast) return null

  return (
    <div className={`admin-toast admin-toast--${toast.type ?? 'success'}`} role="status">
      {toast.message}
    </div>
  )
}

export default Toast
