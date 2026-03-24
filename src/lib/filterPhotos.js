export function matchesFilters(photo, { poleLineName, poleNumber, constructionNumber }) {
  if (poleLineName && !photo.pole_line_name?.includes(poleLineName)) return false
  if (poleNumber && !photo.pole_number?.includes(poleNumber)) return false
  if (constructionNumber && !photo.construction_number?.includes(constructionNumber)) return false
  return true
}
