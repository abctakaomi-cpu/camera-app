import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Header from '../components/Header'
import { useRealtimePhotos } from '../hooks/useRealtimePhotos'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/formatDate'

const JAPAN_CENTER = [137.0, 36.5]
const DEFAULT_ZOOM = 5

const MAP_STYLES = {
  osm: {
    label: 'OpenStreetMap',
    style: {
      version: 8,
      sources: {
        basemap: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
      },
      layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
    },
  },
  gsi_standard: {
    label: '国土地理院（標準）',
    style: {
      version: 8,
      sources: {
        basemap: {
          type: 'raster',
          tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
        },
      },
      layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
    },
  },
  gsi_photo: {
    label: '国土地理院（航空写真）',
    style: {
      version: 8,
      sources: {
        basemap: {
          type: 'raster',
          tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],
          tileSize: 256,
          attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
        },
      },
      layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
    },
  },
}

function MapPage() {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [mapStyle, setMapStyle] = useState('osm')
  const { photos, loading } = useRealtimePhotos(null)

  useEffect(() => {
    if (mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[mapStyle].style,
      center: JAPAN_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // マップスタイル切り替え
  useEffect(() => {
    if (!mapRef.current) return
    const center = mapRef.current.getCenter()
    const zoom = mapRef.current.getZoom()
    mapRef.current.setStyle(MAP_STYLES[mapStyle].style)
    mapRef.current.once('styledata', () => {
      mapRef.current.setCenter(center)
      mapRef.current.setZoom(zoom)
    })
  }, [mapStyle])

  useEffect(() => {
    if (!mapRef.current || loading) return

    // 既存マーカーを削除
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const geoPhotos = photos.filter((p) => p.latitude && p.longitude)

    geoPhotos.forEach((photo) => {
      const popup = new maplibregl.Popup({ offset: 25, maxWidth: '220px' })

      const popupContent = document.createElement('div')
      popupContent.className = 'map-popup'
      popupContent.innerHTML = `
        <div class="map-popup-loading">読み込み中...</div>
        <div class="map-popup-info">
          ${photo.projects?.area ? `<strong>${photo.projects.area}</strong>` : ''}
          <span>${formatDate(photo.taken_at || photo.created_at)}</span>
          ${photo.pole_line_name || photo.pole_number ? `<span>電柱: ${[photo.pole_line_name, photo.pole_number].filter(Boolean).join(' ')}</span>` : ''}
        </div>
      `

      popup.setDOMContent(popupContent)

      popup.on('open', () => {
        supabase.storage
          .from('photos')
          .createSignedUrl(photo.storage_path, 3600)
          .then(({ data }) => {
            if (data?.signedUrl) {
              const loadingEl = popupContent.querySelector('.map-popup-loading')
              if (loadingEl) {
                loadingEl.innerHTML = `<img src="${data.signedUrl}" alt="${photo.file_name || '写真'}" class="map-popup-img" />`
              }
            }
          })
      })

      const DRAG_OFFSET_PX = 60

      const marker = new maplibregl.Marker({ draggable: true })
        .setLngLat([photo.longitude, photo.latitude])
        .setPopup(popup)
        .addTo(mapRef.current)

      let ghostMarker = null
      const originalLngLat = [photo.longitude, photo.latitude]

      marker.on('dragstart', () => {
        // ゴーストマーカーを元の位置に50%透過で表示
        ghostMarker = new maplibregl.Marker({ color: '#1a73e8' })
          .setLngLat(originalLngLat)
          .addTo(mapRef.current)
        ghostMarker.getElement().style.opacity = '0.5'

        // ドラッグ中のピンを上方オフセット
        const el = marker.getElement()
        el.style.transform = el.style.transform + ' translateY(-60px)'
      })

      marker.on('drag', () => {
        // ドラッグ中も継続的にオフセットを維持
        const el = marker.getElement()
        if (!el.style.transform.includes('translateY(-60px)')) {
          el.style.transform = el.style.transform + ' translateY(-60px)'
        }
      })

      marker.on('dragend', async () => {
        // オフセット解除
        const el = marker.getElement()
        el.style.transform = el.style.transform.replace(' translateY(-60px)', '')

        // 指の位置から上方オフセット分を補正して、ピンの見た目位置の座標を算出
        const fingerLngLat = marker.getLngLat()
        const fingerPixel = mapRef.current.project(fingerLngLat)
        const correctedPixel = { x: fingerPixel.x, y: fingerPixel.y - DRAG_OFFSET_PX }
        const correctedLngLat = mapRef.current.unproject(correctedPixel)

        // 補正座標にマーカーを設定
        marker.setLngLat(correctedLngLat)

        // ゴースト削除
        if (ghostMarker) {
          ghostMarker.remove()
          ghostMarker = null
        }

        // DB更新
        const { error: updateError } = await supabase
          .from('photos')
          .update({ latitude: correctedLngLat.lat, longitude: correctedLngLat.lng })
          .eq('id', photo.id)

        if (updateError) {
          marker.setLngLat(originalLngLat)
          alert('座標の更新に失敗しました')
        } else {
          originalLngLat[0] = correctedLngLat.lng
          originalLngLat[1] = correctedLngLat.lat
          photo.latitude = correctedLngLat.lat
          photo.longitude = correctedLngLat.lng
        }
      })

      markersRef.current.push(marker)
    })

    // 写真の位置にフィット
    if (geoPhotos.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      geoPhotos.forEach((p) => bounds.extend([p.longitude, p.latitude]))

      if (geoPhotos.length === 1) {
        mapRef.current.flyTo({ center: bounds.getCenter(), zoom: 15 })
      } else {
        mapRef.current.fitBounds(bounds, { padding: 60 })
      }
    }
  }, [photos, loading])

  return (
    <div className="map-page">
      <Header title="マップ" />
      <div className="map-style-switcher">
        {Object.entries(MAP_STYLES).map(([key, { label }]) => (
          <button
            key={key}
            className={`map-style-btn ${mapStyle === key ? 'active' : ''}`}
            onClick={() => setMapStyle(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  )
}

export default MapPage
