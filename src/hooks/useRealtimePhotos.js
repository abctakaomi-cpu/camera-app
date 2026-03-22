import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimePhotos(buildingName) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('photos')
        .select('*, projects(area)')
        .order('created_at', { ascending: false })

      if (buildingName) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('area', buildingName)

        if (projects && projects.length > 0) {
          const projectIds = projects.map((p) => p.id)
          query = query.in('project_id', projectIds)
        } else {
          setPhotos([])
          setLoading(false)
          return
        }
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setPhotos(data || [])
      }
      setLoading(false)
    }

    fetchPhotos()

    const channel = supabase
      .channel('photos-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'photos' },
        async (payload) => {
          const { data } = await supabase
            .from('photos')
            .select('*, projects(area)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            if (buildingName && data.projects?.area !== buildingName) {
              return
            }
            setPhotos((prev) => [data, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [buildingName])

  return { photos, loading, error }
}
