import { useState, useEffect } from 'react'
import Header from '../components/Header'
import PhotoCard from '../components/PhotoCard'
import { useRealtimePhotos } from '../hooks/useRealtimePhotos'
import { supabase } from '../lib/supabase'


function PhotoListPage() {
  const [buildingFilter, setBuildingFilter] = useState('')
  const [poleLineFilter, setPoleLineFilter] = useState('')
  const [poleNumberFilter, setPoleNumberFilter] = useState('')
  const [constructionFilter, setConstructionFilter] = useState('')
  const [buildings, setBuildings] = useState([])
  const [suggestions, setSuggestions] = useState({ poleLineNames: [], poleNumbers: [], constructionNumbers: [] })
  const { photos, loading, error } = useRealtimePhotos(buildingFilter || null)

  const filteredPhotos = photos.filter((p) => {
    if (poleLineFilter && !p.pole_line_name?.includes(poleLineFilter)) return false
    if (poleNumberFilter && !p.pole_number?.includes(poleNumberFilter)) return false
    if (constructionFilter && !p.construction_number?.includes(constructionFilter)) return false
    return true
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select('area')
        .not('area', 'is', null)
        .order('area')

      if (projects) {
        setBuildings([...new Set(projects.map((d) => d.area).filter(Boolean))])
      }

      const { data: photoData } = await supabase
        .from('photos')
        .select('pole_line_name, pole_number, construction_number')

      if (photoData) {
        setSuggestions({
          poleLineNames: [...new Set(photoData.map((d) => d.pole_line_name).filter(Boolean))].sort(),
          poleNumbers: [...new Set(photoData.map((d) => d.pole_number).filter(Boolean))].sort(),
          constructionNumbers: [...new Set(photoData.map((d) => d.construction_number).filter(Boolean))].sort(),
        })
      }
    }
    fetchData()
  }, [])

  return (
    <div className="photolist-page">
      <Header title="写真一覧" />

      <div className="photolist-content">
        <div className="photolist-filters">
          <div className="photolist-filter">
            <label htmlFor="filter-building">ビル名</label>
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
          <div className="photolist-filter">
            <label>電柱番号</label>
            <div className="pole-inputs">
              <input
                id="filter-pole-line"
                type="text"
                list="filter-pole-line-names"
                value={poleLineFilter}
                onChange={(e) => setPoleLineFilter(e.target.value)}
                placeholder="幹線名"
              />
              <datalist id="filter-pole-line-names">
                {suggestions.poleLineNames.map((v) => <option key={v} value={v} />)}
              </datalist>
              <input
                id="filter-pole-number"
                type="text"
                list="filter-pole-numbers"
                value={poleNumberFilter}
                onChange={(e) => setPoleNumberFilter(e.target.value)}
                placeholder="番号"
              />
              <datalist id="filter-pole-numbers">
                {suggestions.poleNumbers.map((v) => <option key={v} value={v} />)}
              </datalist>
            </div>
          </div>
          <div className="photolist-filter">
            <label htmlFor="filter-construction">工事番号</label>
            <input
              id="filter-construction"
              type="text"
              list="filter-construction-numbers"
              value={constructionFilter}
              onChange={(e) => setConstructionFilter(e.target.value)}
              placeholder="工事番号で絞り込み"
            />
            <datalist id="filter-construction-numbers">
              {suggestions.constructionNumbers.map((v) => <option key={v} value={v} />)}
            </datalist>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : filteredPhotos.length === 0 ? (
          <div className="empty">写真がありません</div>
        ) : (
          <div className="photo-grid">
            {filteredPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PhotoListPage
