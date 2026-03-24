import { useCallback } from 'react'

export function useGeolocation() {
  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      return Promise.reject(new Error('このブラウザでは位置情報を取得できません'))
    }

    const tryGeo = (highAccuracy) => {
      const geoPromise = new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          },
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error('位置情報の使用が許可されていません'))
                break
              case error.POSITION_UNAVAILABLE:
                reject(new Error('位置情報を取得できませんでした'))
                break
              case error.TIMEOUT:
                reject(new Error('位置情報の取得がタイムアウトしました'))
                break
              default:
                reject(new Error('位置情報の取得に失敗しました'))
            }
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: 8000,
            maximumAge: 60000,
          }
        )
      })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('位置情報の取得がタイムアウトしました')), 10000)
      })

      return Promise.race([geoPromise, timeoutPromise])
    }

    // まず低精度（WiFi/基地局）で試み、成功したら高精度で再取得を試みる
    // iOS Chromeではenabled HighAccuracy:trueがハングすることがあるため
    return tryGeo(false).catch(() => tryGeo(true))
  }, [])

  return { getPosition }
}
