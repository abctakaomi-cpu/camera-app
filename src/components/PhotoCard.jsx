import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function PhotoCard({ photo }) {
  const [imageUrl, setImageUrl] = useState(null)

  useEffect(() => {
    supabase.storage
      .from('photos')
      .createSignedUrl(photo.storage_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setImageUrl(data.signedUrl)
      })
  }, [photo.storage_path])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="photo-card">
      <div className="photo-card-image">
        <img src={imageUrl} alt={photo.file_name || '写真'} loading="lazy" />
      </div>
      <div className="photo-card-info">
        {photo.projects?.area && (
          <span className="photo-card-building">{photo.projects.area}</span>
        )}
        <span className="photo-card-date">
          {formatDate(photo.taken_at || photo.created_at)}
        </span>
        {(photo.pole_line_name || photo.pole_number) && (
          <span className="photo-card-pole">電柱: {[photo.pole_line_name, photo.pole_number].filter(Boolean).join(' ')}</span>
        )}
        {photo.construction_number && (
          <span className="photo-card-construction">工事: {photo.construction_number}</span>
        )}
        {photo.latitude && photo.longitude && (
          <span className="photo-card-gps">
            {photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}
          </span>
        )}
        {photo.comment && (
          <span className="photo-card-comment">{photo.comment}</span>
        )}
      </div>
    </div>
  )
}

export default PhotoCard
