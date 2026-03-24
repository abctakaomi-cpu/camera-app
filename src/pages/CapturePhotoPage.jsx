import { useState, useEffect, useRef } from 'react'
import Header from '../components/Header'
import BuildingNameSelect from '../components/BuildingNameSelect'
import { useGeolocation } from '../hooks/useGeolocation'
import { useCompass } from '../hooks/useCompass'
import { uploadPhoto } from '../lib/uploadPhoto'
import { supabase } from '../lib/supabase'

function CapturePhotoPage({ session }) {
  const [buildingName, setBuildingName] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [gps, setGps] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [gpsBlocked, setGpsBlocked] = useState(false)
  const [poleLineName, setPoleLineName] = useState('')
  const [poleNumber, setPoleNumber] = useState('')
  const [constructionNumber, setConstructionNumber] = useState('')
  const [comment, setComment] = useState('')
  const fileInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const [suggestions, setSuggestions] = useState({ poleLineNames: [], poleNumbers: [], constructionNumbers: [] })

  const { getPosition } = useGeolocation()
  const { compassDirection } = useCompass()

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from('photos')
        .select('pole_line_name, pole_number, construction_number')

      if (data) {
        setSuggestions({
          poleLineNames: [...new Set(data.map((d) => d.pole_line_name).filter(Boolean))].sort(),
          poleNumbers: [...new Set(data.map((d) => d.pole_number).filter(Boolean))].sort(),
          constructionNumbers: [...new Set(data.map((d) => d.construction_number).filter(Boolean))].sort(),
        })
      }
    }
    fetchSuggestions()
  }, [])

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
      setGpsBlocked(err.message.includes('許可されていません'))
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
        poleLineName,
        poleNumber,
        constructionNumber,
        comment,
      })

      setStatus('アップロード完了')
      setFile(null)
      setPreview(null)
      setGps(null)
      setPoleLineName('')
      setPoleNumber('')
      setConstructionNumber('')
      setComment('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (galleryInputRef.current) galleryInputRef.current.value = ''
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
          <div className="capture-field">
            <label>電柱番号</label>
            <div className="pole-inputs">
              <input
                id="pole-line-name"
                type="text"
                list="pole-line-names"
                value={poleLineName}
                onChange={(e) => setPoleLineName(e.target.value)}
                placeholder="幹線名"
              />
              <datalist id="pole-line-names">
                {suggestions.poleLineNames.map((v) => <option key={v} value={v} />)}
              </datalist>
              <input
                id="pole-number"
                type="text"
                list="pole-numbers"
                value={poleNumber}
                onChange={(e) => setPoleNumber(e.target.value)}
                placeholder="番号"
              />
              <datalist id="pole-numbers">
                {suggestions.poleNumbers.map((v) => <option key={v} value={v} />)}
              </datalist>
            </div>
          </div>
          <div className="capture-field">
            <label htmlFor="construction-number">工事番号</label>
            <input
              id="construction-number"
              type="text"
              list="construction-numbers"
              value={constructionNumber}
              onChange={(e) => setConstructionNumber(e.target.value)}
              placeholder="工事番号を入力"
            />
            <datalist id="construction-numbers">
              {suggestions.constructionNumbers.map((v) => <option key={v} value={v} />)}
            </datalist>
          </div>
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
            <button
              className="retry-gps-btn"
              onClick={async () => {
                setError('')
                setGpsBlocked(false)
                try {
                  const position = await getPosition()
                  setGps(position)
                } catch (err) {
                  setError(err.message)
                  setGpsBlocked(err.message.includes('許可されていません'))
                }
              }}
            >
              位置情報を再取得
            </button>
          </div>
        )}
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
