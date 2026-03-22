import { useState, useRef } from 'react'
import Header from '../components/Header'
import BuildingNameSelect from '../components/BuildingNameSelect'
import { useGeolocation } from '../hooks/useGeolocation'
import { useCompass } from '../hooks/useCompass'
import { uploadPhoto } from '../lib/uploadPhoto'

function CapturePhotoPage({ session }) {
  const [buildingName, setBuildingName] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [gps, setGps] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const { getPosition } = useGeolocation()
  const { compassDirection } = useCompass()

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setError('')
    setStatus('')

    try {
      const position = await getPosition()
      setGps(position)
    } catch (err) {
      setGps(null)
      setError(err.message)
    }
  }

  const handleUpload = async () => {
    if (!file || !buildingName) return

    setUploading(true)
    setError('')
    setStatus('')

    try {
      await uploadPhoto({
        file,
        buildingName,
        userId: session.user.id,
        latitude: gps?.latitude || null,
        longitude: gps?.longitude || null,
        compassDirection: compassDirection || null,
      })

      setStatus('アップロード完了')
      setFile(null)
      setPreview(null)
      setGps(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="capture-page">
      <Header title="写真撮影" />

      <div className="capture-content">
        <BuildingNameSelect value={buildingName} onChange={setBuildingName} />

        <div className="capture-camera">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            id="camera-input"
            hidden
          />
          <button
            className="camera-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            📷 写真を撮影
          </button>
        </div>

        {preview && (
          <div className="capture-preview">
            <img src={preview} alt="プレビュー" />
            <div className="capture-meta">
              {gps && (
                <p>GPS: {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)}</p>
              )}
              {compassDirection !== null && (
                <p>方位: {Math.round(compassDirection)}°</p>
              )}
            </div>
          </div>
        )}

        {error && <div className="error">{error}</div>}
        {status && <div className="message">{status}</div>}

        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={!file || !buildingName || uploading}
        >
          {uploading ? 'アップロード中...' : 'アップロード'}
        </button>
      </div>
    </div>
  )
}

export default CapturePhotoPage
