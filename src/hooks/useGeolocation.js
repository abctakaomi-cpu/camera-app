import { useCallback } from 'react'

export function useGeolocation() {
  const getPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('このブラウザでは位置情報を取得できません'))
        return
      }

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
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }, [])

  return { getPosition }
}
