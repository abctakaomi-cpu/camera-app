import { useState, useEffect } from 'react'
import Header from '../components/Header'
import PhotoCard from '../components/PhotoCard'
import { useRealtimePhotos } from '../hooks/useRealtimePhotos'
import { supabase } from '../lib/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

function PhotoListPage() {
  const [buildingFilter, setBuildingFilter] = useState('')
  const [buildings, setBuildings] = useState([])
  const { photos, loading, error } = useRealtimePhotos(buildingFilter || null)

  useEffect(() => {
    const fetchBuildings = async () => {
      const { data } = await supabase
        .from('projects')
        .select('area')
        .not('area', 'is', null)
        .order('area')

      if (data) {
        const unique = [...new Set(data.map((d) => d.area).filter(Boolean))]
        setBuildings(unique)
      }
    }
    fetchBuildings()
  }, [])

  return (
    <div className="photolist-page">
      <Header title="写真一覧" />

      <div className="photolist-content">
        <div className="photolist-filter">
          <label htmlFor="filter-building">ビル名で絞り込み</label>
          <select
            id="filter-building"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            <option value="">全て</option>
            {buildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : photos.length === 0 ? (
          <div className="empty">写真がありません</div>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                storageUrl={supabaseUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PhotoListPage
