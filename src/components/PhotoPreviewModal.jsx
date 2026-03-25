import { useState } from 'react'
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

        <div className="preview-image">
          <img src={imageUrl} alt={photo.file_name || '写真'} />
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
