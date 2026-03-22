import { useState } from 'react'
import { supabase } from '../lib/supabase'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage('確認メールを送信しました。メールを確認してください。')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      }
    }

    setSubmitting(false)
  }

  return (
    <div className="container">
      <h1>工事管理アプリ</h1>
      <form onSubmit={handleSubmit}>
        <h2>{isSignUp ? '新規登録' : 'ログイン'}</h2>

        {error && <div className="error">{error}</div>}
        {message && <div className="message">{message}</div>}

        <div className="field">
          <label htmlFor="email">メールアドレス</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">パスワード</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? '処理中...' : isSignUp ? '新規登録' : 'ログイン'}
        </button>

        <p className="toggle">
          {isSignUp ? 'アカウントをお持ちの方は' : 'アカウントをお持ちでない方は'}
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}>
            {isSignUp ? 'ログイン' : '新規登録'}
          </button>
        </p>
      </form>
    </div>
  )
}

export default LoginPage
