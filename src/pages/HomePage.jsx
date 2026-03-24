import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function HomePage({ session }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="container">
      <h1>工事管理アプリ</h1>
      <p>ようこそ、{session.user.email} さん</p>

      <div className="home-nav">
        <button className="nav-btn primary" onClick={() => navigate('/capture')}>
          📷 写真を撮影
        </button>
        <button className="nav-btn secondary" onClick={() => navigate('/photos')}>
          🖼 写真一覧
        </button>
        <button className="nav-btn secondary" onClick={() => navigate('/map')}>
          🗺 マップ
        </button>
      </div>

      <div className="home-logout">
        <button onClick={handleLogout}>ログアウト</button>
      </div>
    </div>
  )
}

export default HomePage
