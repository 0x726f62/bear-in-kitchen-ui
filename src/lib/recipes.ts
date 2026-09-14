export function recipeUrl(id: string) {
  return `/recipe/${id.split('/').map(encodeURIComponent).join('/')}/`;
}
