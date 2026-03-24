import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useBuildings() {
  const [buildings, setBuildings] = useState([])

  useEffect(() => {
    const fetchBuildings = async () => {
      const { data } = await supabase
        .from('projects')
        .select('area')
        .not('area', 'is', null)
        .order('area')

      if (data) {
        setBuildings([...new Set(data.map((d) => d.area).filter(Boolean))])
      }
    }
    fetchBuildings()
  }, [])

  return buildings
}
