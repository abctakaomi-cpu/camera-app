function PhotoCard({ photo, storageUrl }) {
  const imageUrl = `${storageUrl}/storage/v1/object/public/photos/${photo.storage_path}`

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
        {photo.latitude && photo.longitude && (
          <span className="photo-card-gps">
            {photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}
          </span>
        )}
      </div>
    </div>
  )
}

export default PhotoCard
