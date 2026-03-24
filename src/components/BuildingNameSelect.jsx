import { useBuildings } from '../hooks/useBuildings'

function BuildingNameSelect({ value, onChange }) {
  const buildings = useBuildings()

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
