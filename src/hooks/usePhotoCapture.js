import { useState, useRef, useEffect } from 'react'
import { useGeolocation } from './useGeolocation'
import { extractExifGps } from '../lib/extractExifGps'

export function usePhotoCapture() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [gps, setGps] = useState(null)
  const [gpsBlocked, setGpsBlocked] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const preloadedGps = useRef(null)

  const { getPosition } = useGeolocation()

  // ページ読み込み時にGPSを先行取得（カメラ復帰後のフォールバック用）
  useEffect(() => {
    getPosition()
      .then((pos) => { preloadedGps.current = pos })
      .catch(() => { preloadedGps.current = null })
  }, [getPosition])

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setError('')

    // 1. EXIFからGPS取得を試みる
    const exifGps = await extractExifGps(selected)
    if (exifGps) {
      setGps(exifGps)
      setGpsBlocked(false)
      return
    }

    // 2. navigator.geolocationで取得を試みる
    try {
      const position = await getPosition()
      setGps(position)
      setGpsBlocked(false)
      return
    } catch {
      // geolocation失敗 → フォールバックへ
    }

    // 3. 先行取得しておいたGPSをフォールバックとして使用
    if (preloadedGps.current) {
      setGps(preloadedGps.current)
      setGpsBlocked(false)
      return
    }

    // 全て失敗
    setGps(null)
    setError('位置情報を取得できませんでした。「位置情報を再取得」ボタンをお試しください。')
    setGpsBlocked(true)
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
    file, preview, gps, gpsBlocked, error, setError,
    fileInputRef, galleryInputRef,
    handleFileChange, retryGps, reset,
  }
}
