export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function plural(n, word, words = `${word}s`) {
  return `${n} ${n === 1 ? word : words}`
}

// Ingredients arrive as free text like "1.5 oz mezcal". For the card summary
// we drop the measures so the line reads as flavors, not a spec.
export function ingredientNames(ingredients) {
  return ingredients.map((line) =>
    line
      .replace(/^[\d.\/½¼¾\s]+(oz|ml|cl|dash(es)?|drops?|barspoons?|tsp|tbsp|parts?|cups?)\b\.?\s*/i, '')
      .replace(/^\d+[\d.\/\s]*/, '')
      .trim(),
  )
}
