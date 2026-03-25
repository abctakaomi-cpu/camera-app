import { useState } from 'react'
import Header from '../components/Header'
import PhotoCard from '../components/PhotoCard'
import PhotoPreviewModal from '../components/PhotoPreviewModal'
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
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState(null)
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

  const handlePhotoClick = (photo, imageUrl) => {
    setSelectedPhoto(photo)
    setSelectedImageUrl(imageUrl)
  }

  const handleUpdate = (photoId, updates) => {
    // ローカルのphotoオブジェクトを更新
    const photo = photos.find((p) => p.id === photoId)
    if (photo) {
      Object.assign(photo, updates)
    }
    // モーダルのphotoも更新
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto({ ...selectedPhoto, ...updates })
    }
  }

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
              <PhotoCard key={photo.id} photo={photo} onClick={handlePhotoClick} />
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <PhotoPreviewModal
          photo={selectedPhoto}
          imageUrl={selectedImageUrl}
          onClose={() => setSelectedPhoto(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}

export default PhotoListPage
