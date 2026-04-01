import React, { useContext, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'

const ProtectedRoute = ({ children }) => {
  const { token, isAuthLoaded } = useContext(ShopContext)
  const location = useLocation()

  useEffect(() => {
    if (isAuthLoaded && !token) {
      toast.warning('Please log in to continue.')
    }
  }, [isAuthLoaded, token])

  if (!isAuthLoaded) {
    return null
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
