import { supabase } from './supabase'

export async function uploadPhoto({
  file,
  buildingName,
  userId,
  latitude,
  longitude,
  compassDirection,
}) {
  // 1. Find or create project
  let { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('area', buildingName)
    .single()

  if (!project) {
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({ project_name: buildingName, area: buildingName })
      .select('id')
      .single()

    if (projectError) throw new Error('プロジェクトの作成に失敗しました: ' + projectError.message)
    project = newProject
  }

  // 2. Upload to Storage
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  const ext = file.name?.split('.').pop() || 'jpg'
  const fileName = `${timestamp}_${randomId}.${ext}`
  const storagePath = `${project.id}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(storagePath, file)

  if (uploadError) throw new Error('写真のアップロードに失敗しました: ' + uploadError.message)

  // 3. Insert DB record
  const { data: photo, error: insertError } = await supabase
    .from('photos')
    .insert({
      project_id: project.id,
      storage_path: storagePath,
      file_name: fileName,
      taken_at: new Date().toISOString(),
      uploaded_by: userId,
      latitude,
      longitude,
      compass_direction: compassDirection,
    })
    .select('*, projects(area)')
    .single()

  if (insertError) throw new Error('写真データの保存に失敗しました: ' + insertError.message)

  return photo
}
