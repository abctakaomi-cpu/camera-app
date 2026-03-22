import { useState, useEffect } from 'react'

export function useCompass() {
  const [compassDirection, setCompassDirection] = useState(null)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      setSupported(false)
      return
    }

    const handleOrientation = (event) => {
      if (event.webkitCompassHeading !== undefined) {
        setCompassDirection(event.webkitCompassHeading)
      } else if (event.alpha !== null) {
        setCompassDirection(360 - event.alpha)
      }
    }

    // iOS 13+ requires permission
    if (
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation)
          } else {
            setSupported(false)
          }
        })
        .catch(() => setSupported(false))
    } else {
      window.addEventListener('deviceorientation', handleOrientation)
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [])

  return { compassDirection, supported }
}
