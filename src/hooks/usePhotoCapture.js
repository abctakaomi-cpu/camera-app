import { useState, useRef } from 'react'
import { useGeolocation } from './useGeolocation'

export function usePhotoCapture() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [gps, setGps] = useState(null)
  const [gpsBlocked, setGpsBlocked] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const { getPosition } = useGeolocation()

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setError('')

    try {
      const position = await getPosition()
      setGps(position)
      setGpsBlocked(false)
    } catch (err) {
      setGps(null)
      setError(err.message)
      setGpsBlocked(err.message.includes('許可されていません'))
    }
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
