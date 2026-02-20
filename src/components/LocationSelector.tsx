import {
  getRegions,
  getCities,
  getAreas,
  type Region,
  type City,
} from '@/lib/thailandLocations'
import './LocationSelector.css'

export type LocationValue = {
  region: string
  city: string
  area: string
}

interface LocationSelectorProps {
  value: LocationValue
  onChange: (v: LocationValue) => void
  disabled?: boolean
}

export function LocationSelector({ value, onChange, disabled }: LocationSelectorProps) {
  const regions = getRegions()
  const cities = getCities(value.region as Region)
  const areas = getAreas(value.region as Region, value.city as City)

  return (
    <div className="location-selector">
      <label className="location-label">
        <span className="location-icon">📍</span>
        Region
      </label>
      <select
        className="location-select"
        value={value.region}
        onChange={(e) =>
          onChange({
            region: e.target.value,
            city: '',
            area: '',
          })
        }
        disabled={disabled}
      >
        <option value="">Select region</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label className="location-label">City</label>
      <select
        className="location-select"
        value={value.city}
        onChange={(e) =>
          onChange({
            ...value,
            city: e.target.value,
            area: '',
          })
        }
        disabled={disabled || !value.region}
      >
        <option value="">Select city</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className="location-label">Area</label>
      <select
        className="location-select"
        value={value.area}
        onChange={(e) => onChange({ ...value, area: e.target.value })}
        disabled={disabled || !value.city}
      >
        <option value="">Select area</option>
        {areas.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  )
}
