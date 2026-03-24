import { useState } from 'react'
import Header from '../components/Header'
import PhotoCard from '../components/PhotoCard'
import PoleFilterInputs from '../components/PoleFilterInputs'
import { useRealtimePhotos } from '../hooks/useRealtimePhotos'
import { useBuildings } from '../hooks/useBuildings'
import { useSuggestions } from '../hooks/useSuggestions'
import { matchesFilters } from '../lib/filterPhotos'

function PhotoListPage() {
  const [buildingFilter, setBuildingFilter] = useState('')
  const [poleLineFilter, setPoleLineFilter] = useState('')
  const [poleNumberFilter, setPoleNumberFilter] = useState('')
  const [constructionFilter, setConstructionFilter] = useState('')
  const buildings = useBuildings()
  const { photos, loading, error } = useRealtimePhotos(buildingFilter || null)

  const suggestions = useSuggestions(photos, {
    poleLineName: poleLineFilter,
    poleNumber: poleNumberFilter,
    constructionNumber: constructionFilter,
  })

  const filteredPhotos = photos.filter((p) =>
    matchesFilters(p, {
      poleLineName: poleLineFilter,
      poleNumber: poleNumberFilter,
      constructionNumber: constructionFilter,
    })
  )

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
          <PoleFilterInputs
            poleLineName={poleLineFilter}
            onPoleLineNameChange={setPoleLineFilter}
            poleNumber={poleNumberFilter}
            onPoleNumberChange={setPoleNumberFilter}
            constructionNumber={constructionFilter}
            onConstructionNumberChange={setConstructionFilter}
            suggestions={suggestions}
            idPrefix="filter"
          />
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : filteredPhotos.length === 0 ? (
          <div className="empty">写真がありません</div>
        ) : (
          <div className="photo-grid">
            {filteredPhotos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PhotoListPage
