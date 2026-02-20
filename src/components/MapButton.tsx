import './MapButton.css'

interface MapButtonProps {
  lat: number
  lng: number
  label?: string
  className?: string
}

/**
 * Opens Google Maps (desktop) or device-default map (Apple/Google on mobile).
 */
export function MapButton({ lat, lng, label = 'Open in Maps', className }: MapButtonProps) {
  const isAppleDevice =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod|Macintosh/i.test(navigator.userAgent)

  const googleUrl = `https://www.google.com/maps?q=${lat},${lng}`
  const appleUrl = `https://maps.apple.com/?q=${lat},${lng}`

  const url = isAppleDevice ? appleUrl : googleUrl

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`map-button ${className ?? ''}`}
      aria-label="Open location in maps"
    >
      <span className="map-button-icon">🗺️</span>
      <span className="map-button-label">{label}</span>
    </a>
  )
}
