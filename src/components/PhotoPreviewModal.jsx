import { useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/formatDate'

function EditableField({ label, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  const handleSave = () => {
    setEditing(false)
    if (draft !== (value || '')) {
      onSave(draft)
    }
  }

  if (editing) {
    return (
      <div className="preview-field editing">
        <label>{label}</label>
        <div className="preview-field-edit">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
          />
          <button onClick={handleSave}>保存</button>
        </div>
      </div>
    )
  }

  return (
    <div className="preview-field" onClick={() => { setEditing(true); setDraft(value || '') }}>
      <label>{label}</label>
      <span>{value || '未設定'}</span>
    </div>
  )
}

function EditableComment({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  const handleSave = () => {
    setEditing(false)
    if (draft !== (value || '')) {
      onSave(draft)
    }
  }

  if (editing) {
    return (
      <div className="preview-field editing">
        <label>コメント</label>
        <div className="preview-field-edit">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            rows={3}
          />
          <button onClick={handleSave}>保存</button>
        </div>
      </div>
    )
  }

  return (
    <div className="preview-field" onClick={() => { setEditing(true); setDraft(value || '') }}>
      <label>コメント</label>
      <span>{value || '未設定'}</span>
    </div>
  )
}

function PhotoPreviewModal({ photo, imageUrl, onClose, onUpdate }) {
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const imgRef = useRef(null)
  const pinchRef = useRef({ startDist: 0, startScale: 1 })
  const panRef = useRef({ startX: 0, startY: 0, startTx: 0, startTy: 0 })

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      pinchRef.current = { startDist: getDistance(e.touches), startScale: scale }
    } else if (e.touches.length === 1 && scale > 1) {
      panRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTx: translate.x,
        startTy: translate.y,
      }
    }
  }, [scale, translate])

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const dist = getDistance(e.touches)
      const newScale = Math.max(1, Math.min(5, pinchRef.current.startScale * (dist / pinchRef.current.startDist)))
      setScale(newScale)
      if (newScale <= 1) setTranslate({ x: 0, y: 0 })
    } else if (e.touches.length === 1 && scale > 1) {
      const dx = e.touches[0].clientX - panRef.current.startX
      const dy = e.touches[0].clientY - panRef.current.startY
      setTranslate({ x: panRef.current.startTx + dx, y: panRef.current.startTy + dy })
    }
  }, [scale])

  const handleTouchEnd = useCallback(() => {
    if (scale <= 1) {
      setScale(1)
      setTranslate({ x: 0, y: 0 })
    }
  }, [scale])

  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      setScale(1)
      setTranslate({ x: 0, y: 0 })
    } else {
      setScale(2.5)
    }
  }, [scale])

  const handleFieldUpdate = async (field, value) => {
    const { error } = await supabase
      .from('photos')
      .update({ [field]: value || null })
      .eq('id', photo.id)

    if (!error) {
      onUpdate(photo.id, { [field]: value || null })
    }
  }

  // ビル名更新はprojectsテーブル経由なので別処理
  const handleBuildingUpdate = async (value) => {
    if (!value) return

    let { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('area', value)
      .single()

    if (!project) {
      const { data: newProject } = await supabase
        .from('projects')
        .insert({ project_name: value, area: value })
        .select('id')
        .single()
      project = newProject
    }

    if (project) {
      const { error } = await supabase
        .from('photos')
        .update({ project_id: project.id })
        .eq('id', photo.id)

      if (!error) {
        onUpdate(photo.id, { projects: { area: value } })
      }
    }
  }

  return (
    <div className="preview-overlay">
      <div className="preview-modal">
        <button className="preview-close" onClick={onClose}>✕</button>

        <div
          className="preview-image"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt={photo.file_name || '写真'}
            style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})` }}
            draggable={false}
          />
        </div>

        <div className="preview-info">
          <EditableField
            label="ビル名"
            value={photo.projects?.area}
            onSave={handleBuildingUpdate}
          />
          <EditableField
            label="幹線名"
            value={photo.pole_line_name}
            onSave={(v) => handleFieldUpdate('pole_line_name', v)}
          />
          <EditableField
            label="電柱番号"
            value={photo.pole_number}
            onSave={(v) => handleFieldUpdate('pole_number', v)}
          />
          <EditableField
            label="工事番号"
            value={photo.construction_number}
            onSave={(v) => handleFieldUpdate('construction_number', v)}
          />
          <EditableComment
            value={photo.comment}
            onSave={(v) => handleFieldUpdate('comment', v)}
          />

          <div className="preview-field readonly">
            <label>撮影日時</label>
            <span>{formatDate(photo.taken_at || photo.created_at)}</span>
          </div>
          {photo.latitude && photo.longitude && (
            <div className="preview-field readonly">
              <label>GPS</label>
              <span>{photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PhotoPreviewModal
