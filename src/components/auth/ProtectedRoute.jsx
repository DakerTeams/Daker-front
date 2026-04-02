import { Navigate, useLocation } from 'react-router-dom'
import { getStoredUser } from '../../lib/auth.js'

function ProtectedRoute({ children, allowRoles = null }) {
  const location = useLocation()
  const user = getStoredUser()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (Array.isArray(allowRoles) && allowRoles.length > 0) {
    const normalizedRole = String(user.role ?? 'user').toLowerCase()
    const isAllowed = allowRoles.includes(normalizedRole)

    if (!isAllowed) {
      return <Navigate to="/access-denied" replace />
    }
  }

  return children
}

export default ProtectedRoute
