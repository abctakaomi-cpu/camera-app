import { useNavigate } from 'react-router-dom'

function Header({ title }) {
  const navigate = useNavigate()

  return (
    <header className="header">
      <button className="header-back" onClick={() => navigate(-1)}>
        ← 戻る
      </button>
      <h1 className="header-title">{title}</h1>
    </header>
  )
}

export default Header
