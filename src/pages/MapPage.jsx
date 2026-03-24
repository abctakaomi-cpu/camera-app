import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Header from '../components/Header'
import { useRealtimePhotos } from '../hooks/useRealtimePhotos'
import { supabase } from '../lib/supabase'

const JAPAN_CENTER = [137.0, 36.5]
const DEFAULT_ZOOM = 5

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MapPage() {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const { photos, loading } = useRealtimePhotos(null)

  useEffect(() => {
    if (mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
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

      const marker = new maplibregl.Marker()
        .setLngLat([photo.longitude, photo.latitude])
        .setPopup(popup)
        .addTo(mapRef.current)

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
      <div ref={mapContainer} className="map-container" />
    </div>
  )
}

export default MapPage
