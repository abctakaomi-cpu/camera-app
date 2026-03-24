import { useMemo } from 'react'
import { matchesFilters } from '../lib/filterPhotos'

export function useSuggestions(photos, { poleLineName, poleNumber, constructionNumber }) {
  return useMemo(() => {
    const forPoleLine = photos.filter((p) =>
      matchesFilters(p, { poleNumber, constructionNumber })
    )
    const forPoleNumber = photos.filter((p) =>
      matchesFilters(p, { poleLineName, constructionNumber })
    )
    const forConstruction = photos.filter((p) =>
      matchesFilters(p, { poleLineName, poleNumber })
    )

    return {
      poleLineNames: [...new Set(forPoleLine.map((p) => p.pole_line_name).filter(Boolean))].sort(),
      poleNumbers: [...new Set(forPoleNumber.map((p) => p.pole_number).filter(Boolean))].sort(),
      constructionNumbers: [...new Set(forConstruction.map((p) => p.construction_number).filter(Boolean))].sort(),
    }
  }, [photos, poleLineName, poleNumber, constructionNumber])
}
