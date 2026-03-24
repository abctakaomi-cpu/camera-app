import { useState, useRef, useEffect } from 'react'
import { useGeolocation } from './useGeolocation'
import { extractExifGps } from '../lib/extractExifGps'

export function usePhotoCapture() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [gps, setGps] = useState(null)
  const [gpsBlocked, setGpsBlocked] = useState(false)
  const [error, setError] = useState('')
  const [gpsDebug, setGpsDebug] = useState('GPS: 初期化中...')
  const fileInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const preloadedGps = useRef(null)

  const { getPosition } = useGeolocation()

  // ページ読み込み時にGPSを先行取得（カメラ復帰後のフォールバック用）
  useEffect(() => {
    setGpsDebug('GPS: 先行取得中...')
    getPosition()
      .then((pos) => {
        preloadedGps.current = pos
        setGpsDebug(`GPS先行取得: 成功 (${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)})`)
      })
      .catch((err) => {
        preloadedGps.current = null
        setGpsDebug(`GPS先行取得: 失敗 (${err.message})`)
      })
  }, [getPosition])

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setError('')

    // 1. EXIFからGPS取得を試みる
    setGpsDebug('EXIF GPS確認中...')
    const exifGps = await extractExifGps(selected)
    if (exifGps) {
      setGps(exifGps)
      setGpsBlocked(false)
      setGpsDebug(`EXIF GPS: 成功 (${exifGps.latitude.toFixed(5)}, ${exifGps.longitude.toFixed(5)})`)
      return
    }
    setGpsDebug('EXIF GPS: なし → geolocation試行中...')

    // 2. navigator.geolocationで取得を試みる
    try {
      const position = await getPosition()
      setGps(position)
      setGpsBlocked(false)
      setGpsDebug(`Geolocation: 成功 (${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)})`)
      return
    } catch (geoErr) {
      setGpsDebug(`Geolocation: 失敗 (${geoErr.message}) → 先行取得GPS確認中...`)
    }

    // 3. 先行取得しておいたGPSをフォールバックとして使用
    if (preloadedGps.current) {
      setGps(preloadedGps.current)
      setGpsBlocked(false)
      setGpsDebug(`先行取得GPS: 使用 (${preloadedGps.current.latitude.toFixed(5)}, ${preloadedGps.current.longitude.toFixed(5)})`)
      return
    }

    // 全て失敗
    setGps(null)
    setError('位置情報を取得できませんでした。「位置情報を再取得」ボタンをお試しください。')
    setGpsBlocked(true)
    setGpsDebug('GPS: 全て失敗')
  }

  const retryGps = async () => {
    setError('')
    setGpsBlocked(false)
    try {
      const position = await getPosition()
      setGps(position)
    } catch (err) {
      setError(err.message)
      setGpsBlocked(err.message.includes('許可されていません'))
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setGps(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  return {
    file, preview, gps, gpsBlocked, error, setError, gpsDebug,
    fileInputRef, galleryInputRef,
    handleFileChange, retryGps, reset,
  }
}
