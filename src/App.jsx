import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import CapturePhotoPage from './pages/CapturePhotoPage'
import PhotoListPage from './pages/PhotoListPage'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="loading">読み込み中...</div>
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={session ? <HomePage session={session} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/capture"
        element={session ? <CapturePhotoPage session={session} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/photos"
        element={session ? <PhotoListPage /> : <Navigate to="/login" replace />}
      />
    </Routes>
  )
}

export default App
