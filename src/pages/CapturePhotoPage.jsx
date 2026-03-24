import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import BuildingNameSelect from '../components/BuildingNameSelect'
import PoleFilterInputs from '../components/PoleFilterInputs'
import { useCompass } from '../hooks/useCompass'
import { usePhotoCapture } from '../hooks/usePhotoCapture'
import { useSuggestions } from '../hooks/useSuggestions'
import { uploadPhoto } from '../lib/uploadPhoto'
import { supabase } from '../lib/supabase'

function CapturePhotoPage({ session }) {
  const [searchParams] = useSearchParams()
  const [buildingName, setBuildingName] = useState(searchParams.get('building') || '')
  const [poleLineName, setPoleLineName] = useState(searchParams.get('poleLine') || '')
  const [poleNumber, setPoleNumber] = useState(searchParams.get('poleNum') || '')
  const [constructionNumber, setConstructionNumber] = useState(searchParams.get('construction') || '')
  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [allPhotos, setAllPhotos] = useState([])
  const [lastData, setLastData] = useState(null)

  const isIosChrome = /CriOS/.test(navigator.userAgent)
  const { compassDirection } = useCompass()
  const {
    file, preview, gps, gpsBlocked, error, setError,
    fileInputRef, galleryInputRef,
    handleFileChange, retryGps, reset,
  } = usePhotoCapture()

  const suggestions = useSuggestions(allPhotos, { poleLineName, poleNumber, constructionNumber })

  useEffect(() => {
    const fetchData = async () => {
      const { data: photoData } = await supabase
        .from('photos')
        .select('pole_line_name, pole_number, construction_number')
      if (photoData) setAllPhotos(photoData)

      // このユーザーの最後のアップロードデータを取得
      const { data: lastPhoto } = await supabase
        .from('photos')
        .select('projects(area), pole_line_name, pole_number, construction_number')
        .eq('uploaded_by', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastPhoto) {
        setLastData({
          buildingName: lastPhoto.projects?.area || '',
          poleLineName: lastPhoto.pole_line_name || '',
          poleNumber: lastPhoto.pole_number || '',
          constructionNumber: lastPhoto.construction_number || '',
        })
      }
    }
    fetchData()
  }, [session.user.id])

  const handleUpload = async () => {
    if (!file || !buildingName) return

    setUploading(true)
    setError('')
    setStatus('')

    try {
      // ピンからの遷移の場合、ピン座標を優先
      const pinId = searchParams.get('pinId')
      const paramLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null
      const paramLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null

      const useLat = pinId ? (paramLat || gps?.latitude || null) : (gps?.latitude || paramLat || null)
      const useLng = pinId ? (paramLng || gps?.longitude || null) : (gps?.longitude || paramLng || null)

      await uploadPhoto({
        file,
        buildingName,
        userId: session.user.id,
        latitude: useLat,
        longitude: useLng,
        compassDirection: compassDirection || null,
        poleLineName,
        poleNumber,
        constructionNumber,
        comment,
      })

      // 計画ピンからの撮影の場合、ピンを削除
      if (pinId) {
        await supabase.from('planned_pins').delete().eq('id', pinId)
      }

      const uploaded = { buildingName, poleLineName, poleNumber, constructionNumber }
      setLastData(uploaded)
      setStatus('アップロード完了')
      reset()
      setBuildingName('')
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
        {isIosChrome && (
          <div className="ios-chrome-warning">
            iPhoneのChromeではGPS位置情報が正常に取得できません。<strong>Safariでのご利用を推奨します。</strong>
          </div>
        )}

        {lastData && (
          <button
            className="reuse-btn"
            onClick={() => {
              setBuildingName(lastData.buildingName)
              setPoleLineName(lastData.poleLineName)
              setPoleNumber(lastData.poleNumber)
              setConstructionNumber(lastData.constructionNumber)
            }}
          >
            前回のデータを再利用
          </button>
        )}

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
