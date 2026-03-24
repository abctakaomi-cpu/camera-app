import { useMemo } from 'react'

export function useSuggestions(photos, { poleLineName, poleNumber, constructionNumber }) {
  return useMemo(() => {
    const forPoleLine = photos.filter((p) => {
      if (poleNumber && !p.pole_number?.includes(poleNumber)) return false
      if (constructionNumber && !p.construction_number?.includes(constructionNumber)) return false
      return true
    })
    const forPoleNumber = photos.filter((p) => {
      if (poleLineName && !p.pole_line_name?.includes(poleLineName)) return false
      if (constructionNumber && !p.construction_number?.includes(constructionNumber)) return false
      return true
    })
    const forConstruction = photos.filter((p) => {
      if (poleLineName && !p.pole_line_name?.includes(poleLineName)) return false
      if (poleNumber && !p.pole_number?.includes(poleNumber)) return false
      return true
    })

    return {
      poleLineNames: [...new Set(forPoleLine.map((p) => p.pole_line_name).filter(Boolean))].sort(),
      poleNumbers: [...new Set(forPoleNumber.map((p) => p.pole_number).filter(Boolean))].sort(),
      constructionNumbers: [...new Set(forConstruction.map((p) => p.construction_number).filter(Boolean))].sort(),
    }
  }, [photos, poleLineName, poleNumber, constructionNumber])
}
