import { useState, useEffect } from 'react'
import Header from '../components/Header'
import BuildingNameSelect from '../components/BuildingNameSelect'
import PoleFilterInputs from '../components/PoleFilterInputs'
import { useCompass } from '../hooks/useCompass'
import { usePhotoCapture } from '../hooks/usePhotoCapture'
import { useSuggestions } from '../hooks/useSuggestions'
import { uploadPhoto } from '../lib/uploadPhoto'
import { supabase } from '../lib/supabase'

function CapturePhotoPage({ session }) {
  const [buildingName, setBuildingName] = useState('')
  const [poleLineName, setPoleLineName] = useState('')
  const [poleNumber, setPoleNumber] = useState('')
  const [constructionNumber, setConstructionNumber] = useState('')
  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [allPhotos, setAllPhotos] = useState([])

  const { compassDirection } = useCompass()
  const {
    file, preview, gps, gpsBlocked, error, setError, gpsDebug,
    fileInputRef, galleryInputRef,
    handleFileChange, retryGps, reset,
  } = usePhotoCapture()

  const suggestions = useSuggestions(allPhotos, { poleLineName, poleNumber, constructionNumber })

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from('photos')
        .select('pole_line_name, pole_number, construction_number')
      if (data) setAllPhotos(data)
    }
    fetchSuggestions()
  }, [])

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
        poleLineName,
        poleNumber,
        constructionNumber,
        comment,
      })

      setStatus('アップロード完了')
      reset()
      setPoleLineName('')
      setPoleNumber('')
      setConstructionNumber('')
      setComment('')
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

        <div className="capture-fields">
          <PoleFilterInputs
            poleLineName={poleLineName}
            onPoleLineNameChange={setPoleLineName}
            poleNumber={poleNumber}
            onPoleNumberChange={setPoleNumber}
            constructionNumber={constructionNumber}
            onConstructionNumberChange={setConstructionNumber}
            suggestions={suggestions}
          />
          <div className="capture-field">
            <label htmlFor="comment">コメント</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="コメント（任意）"
              rows={3}
            />
          </div>
        </div>

        <div className="capture-buttons">
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
            写真を撮影
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            id="gallery-input"
            hidden
          />
          <button
            className="gallery-btn"
            onClick={() => galleryInputRef.current?.click()}
          >
            ギャラリーから選択
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
        {gpsBlocked && (
          <div className="gps-help">
            <p>位置情報がブロックされています。以下の手順で許可してください：</p>
            <ol>
              <li>ブラウザのアドレスバー左の鍵アイコンをタップ</li>
              <li>「位置情報」を「許可」に変更</li>
              <li>ページを再読み込み</li>
            </ol>
            <button className="retry-gps-btn" onClick={retryGps}>
              位置情報を再取得
            </button>
          </div>
        )}
        {status && <div className="message">{status}</div>}

        <div style={{ background: '#e3f2fd', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8rem', color: '#1565c0', marginBottom: '12px' }}>
          {gpsDebug}
        </div>

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
