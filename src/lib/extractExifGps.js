import exifr from 'exifr'

export async function extractExifGps(file) {
  try {
    const gps = await exifr.gps(file)
    if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number' && !isNaN(gps.latitude) && !isNaN(gps.longitude)) {
      return { latitude: gps.latitude, longitude: gps.longitude }
    }
    return null
  } catch {
    return null
  }
}
