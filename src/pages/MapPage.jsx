import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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

function MapPage({ session }) {
  const navigate = useNavigate()
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const plannedMarkersRef = useRef([])
  const [mapStyle, setMapStyle] = useState('osm')
  const [pinMode, setPinMode] = useState(false)
  const [pendingLngLat, setPendingLngLat] = useState(null)
  const [pinForm, setPinForm] = useState({ buildingName: '', poleLineName: '', poleNumber: '', constructionNumber: '' })
  const [plannedPins, setPlannedPins] = useState([])
  const { photos, loading } = useRealtimePhotos(null)

  // 計画ピンを取得
  const fetchPlannedPins = useCallback(async () => {
    const { data } = await supabase
      .from('planned_pins')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setPlannedPins(data)
  }, [])

  useEffect(() => {
    fetchPlannedPins()
  }, [fetchPlannedPins])

  // マップ初期化
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

  // ピン追加モードのクリックハンドラ
  useEffect(() => {
    if (!mapRef.current) return

    const handleClick = (e) => {
      if (!pinMode) return
      setPendingLngLat([e.lngLat.lng, e.lngLat.lat])
    }

    mapRef.current.on('click', handleClick)
    return () => {
      if (mapRef.current) mapRef.current.off('click', handleClick)
    }
  }, [pinMode])

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

  // 写真マーカー表示
  useEffect(() => {
    if (!mapRef.current || loading) return

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
          <div class="map-popup-title">
            ${photo.projects?.area ? `<strong>${photo.projects.area}</strong>` : ''}
            <a class="streetview-link" target="_blank" rel="noopener" title="Googleストリートビューで開く">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#EA4335"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </a>
          </div>
          <span>${formatDate(photo.taken_at || photo.created_at)}</span>
          ${photo.pole_line_name || photo.pole_number ? `<span>電柱: ${[photo.pole_line_name, photo.pole_number].filter(Boolean).join(' ')}</span>` : ''}
        </div>
      `

      popup.setDOMContent(popupContent)

      popup.on('open', () => {
        // ポップアップを開くたびに最新の座標でストリートビューURLを更新
        const svLink = popupContent.querySelector('.streetview-link')
        if (svLink) {
          svLink.href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${photo.latitude},${photo.longitude}`
        }

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
        ghostMarker = new maplibregl.Marker({ color: '#1a73e8' })
          .setLngLat(originalLngLat)
          .addTo(mapRef.current)
        ghostMarker.getElement().style.opacity = '0.5'

        const el = marker.getElement()
        el.style.transform = el.style.transform + ' translateY(-60px)'
      })

      marker.on('drag', () => {
        const el = marker.getElement()
        if (!el.style.transform.includes('translateY(-60px)')) {
          el.style.transform = el.style.transform + ' translateY(-60px)'
        }
      })

      marker.on('dragend', async () => {
        const el = marker.getElement()
        el.style.transform = el.style.transform.replace(' translateY(-60px)', '')

        const fingerLngLat = marker.getLngLat()
        const fingerPixel = mapRef.current.project(fingerLngLat)
        const correctedPixel = { x: fingerPixel.x, y: fingerPixel.y - DRAG_OFFSET_PX }
        const correctedLngLat = mapRef.current.unproject(correctedPixel)

        marker.setLngLat(correctedLngLat)

        if (ghostMarker) {
          ghostMarker.remove()
          ghostMarker = null
        }

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

    if (geoPhotos.length > 0 && plannedPins.length === 0) {
      const bounds = new maplibregl.LngLatBounds()
      geoPhotos.forEach((p) => bounds.extend([p.longitude, p.latitude]))

      if (geoPhotos.length === 1) {
        mapRef.current.flyTo({ center: bounds.getCenter(), zoom: 15 })
      } else {
        mapRef.current.fitBounds(bounds, { padding: 60 })
      }
    }
  }, [photos, loading])

  // 計画ピン表示
  useEffect(() => {
    if (!mapRef.current) return

    plannedMarkersRef.current.forEach((m) => m.remove())
    plannedMarkersRef.current = []

    plannedPins.forEach((pin) => {
      const popup = new maplibregl.Popup({ offset: 25, maxWidth: '220px' })

      const popupContent = document.createElement('div')
      popupContent.className = 'map-popup'
      popupContent.innerHTML = `
        <div class="map-popup-info">
          ${pin.building_name ? `<strong>${pin.building_name}</strong>` : '<strong>未設定</strong>'}
          ${pin.pole_line_name || pin.pole_number ? `<span>電柱: ${[pin.pole_line_name, pin.pole_number].filter(Boolean).join(' ')}</span>` : ''}
          ${pin.construction_number ? `<span>工事: ${pin.construction_number}</span>` : ''}
        </div>
        <div class="map-popup-actions">
          <button class="map-capture-btn">撮影</button>
          <button class="map-delete-pin-btn">削除</button>
        </div>
      `

      popup.setDOMContent(popupContent)

      popup.on('open', () => {
        const captureBtn = popupContent.querySelector('.map-capture-btn')
        if (captureBtn) {
          captureBtn.onclick = () => {
            const params = new URLSearchParams({
              lat: pin.latitude,
              lng: pin.longitude,
              ...(pin.building_name && { building: pin.building_name }),
              ...(pin.pole_line_name && { poleLine: pin.pole_line_name }),
              ...(pin.pole_number && { poleNum: pin.pole_number }),
              ...(pin.construction_number && { construction: pin.construction_number }),
              pinId: pin.id,
            })
            navigate(`/capture?${params.toString()}`)
          }
        }
        const deleteBtn = popupContent.querySelector('.map-delete-pin-btn')
        if (deleteBtn) {
          deleteBtn.onclick = async () => {
            if (!confirm('このピンを削除しますか？')) return
            await supabase.from('planned_pins').delete().eq('id', pin.id)
            fetchPlannedPins()
          }
        }
      })

      const DRAG_OFFSET_PX = 60

      const marker = new maplibregl.Marker({ color: '#FF9800', draggable: true })
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(popup)
        .addTo(mapRef.current)

      let ghostMarker = null
      const originalLngLat = [pin.longitude, pin.latitude]

      marker.on('dragstart', () => {
        ghostMarker = new maplibregl.Marker({ color: '#FF9800' })
          .setLngLat(originalLngLat)
          .addTo(mapRef.current)
        ghostMarker.getElement().style.opacity = '0.5'

        const el = marker.getElement()
        el.style.transform = el.style.transform + ' translateY(-60px)'
      })

      marker.on('drag', () => {
        const el = marker.getElement()
        if (!el.style.transform.includes('translateY(-60px)')) {
          el.style.transform = el.style.transform + ' translateY(-60px)'
        }
      })

      marker.on('dragend', async () => {
        const el = marker.getElement()
        el.style.transform = el.style.transform.replace(' translateY(-60px)', '')

        const fingerLngLat = marker.getLngLat()
        const fingerPixel = mapRef.current.project(fingerLngLat)
        const correctedPixel = { x: fingerPixel.x, y: fingerPixel.y - DRAG_OFFSET_PX }
        const correctedLngLat = mapRef.current.unproject(correctedPixel)

        marker.setLngLat(correctedLngLat)

        if (ghostMarker) {
          ghostMarker.remove()
          ghostMarker = null
        }

        const { error: updateError } = await supabase
          .from('planned_pins')
          .update({ latitude: correctedLngLat.lat, longitude: correctedLngLat.lng })
          .eq('id', pin.id)

        if (updateError) {
          marker.setLngLat(originalLngLat)
          alert('座標の更新に失敗しました')
        } else {
          originalLngLat[0] = correctedLngLat.lng
          originalLngLat[1] = correctedLngLat.lat
          pin.latitude = correctedLngLat.lat
          pin.longitude = correctedLngLat.lng
        }
      })

      plannedMarkersRef.current.push(marker)
    })
  }, [plannedPins, navigate, fetchPlannedPins])

  // ピン追加保存
  const handleSavePin = async () => {
    if (!pendingLngLat) return

    await supabase.from('planned_pins').insert({
      latitude: pendingLngLat[1],
      longitude: pendingLngLat[0],
      building_name: pinForm.buildingName || null,
      pole_line_name: pinForm.poleLineName || null,
      pole_number: pinForm.poleNumber || null,
      construction_number: pinForm.constructionNumber || null,
      created_by: session.user.id,
    })

    setPendingLngLat(null)
    setPinForm({ buildingName: '', poleLineName: '', poleNumber: '', constructionNumber: '' })
    setPinMode(false)
    fetchPlannedPins()
  }

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

      {/* ピン追加ボタン */}
      <button
        className={`pin-add-btn ${pinMode ? 'active' : ''}`}
        onClick={() => {
          setPinMode(!pinMode)
          setPendingLngLat(null)
        }}
      >
        {pinMode ? 'キャンセル' : 'ピン追加'}
      </button>

      {/* ピン追加モードの案内 */}
      {pinMode && !pendingLngLat && (
        <div className="pin-mode-hint">地図をタップしてピンを配置</div>
      )}

      {/* ピン情報入力フォーム */}
      {pendingLngLat && (
        <div className="pin-form-overlay">
          <div className="pin-form">
            <h3>ピン情報を入力</h3>
            <p className="pin-form-coords">
              座標: {pendingLngLat[1].toFixed(5)}, {pendingLngLat[0].toFixed(5)}
            </p>
            <label>ビル名</label>
            <input
              type="text"
              value={pinForm.buildingName}
              onChange={(e) => setPinForm({ ...pinForm, buildingName: e.target.value })}
              placeholder="ビル名"
            />
            <label>幹線名</label>
            <input
              type="text"
              value={pinForm.poleLineName}
              onChange={(e) => setPinForm({ ...pinForm, poleLineName: e.target.value })}
              placeholder="幹線名"
            />
            <label>電柱番号</label>
            <input
              type="text"
              value={pinForm.poleNumber}
              onChange={(e) => setPinForm({ ...pinForm, poleNumber: e.target.value })}
              placeholder="番号"
            />
            <label>工事番号</label>
            <input
              type="text"
              value={pinForm.constructionNumber}
              onChange={(e) => setPinForm({ ...pinForm, constructionNumber: e.target.value })}
              placeholder="工事番号"
            />
            <div className="pin-form-buttons">
              <button className="pin-form-save" onClick={handleSavePin}>保存</button>
              <button className="pin-form-cancel" onClick={() => setPendingLngLat(null)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapPage
