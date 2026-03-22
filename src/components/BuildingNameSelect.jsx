import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function BuildingNameSelect({ value, onChange }) {
  const [buildings, setBuildings] = useState([])

  useEffect(() => {
    const fetchBuildings = async () => {
      const { data } = await supabase
        .from('projects')
        .select('area')
        .not('area', 'is', null)
        .order('area')

      if (data) {
        const unique = [...new Set(data.map((d) => d.area).filter(Boolean))]
        setBuildings(unique)
      }
    }
    fetchBuildings()
  }, [])

  return (
    <div className="building-select">
      <label htmlFor="building-name">ビル名</label>
      <input
        id="building-name"
        list="building-names"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ビル名を入力または選択"
        required
      />
      <datalist id="building-names">
        {buildings.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
    </div>
  )
}

export default BuildingNameSelect
