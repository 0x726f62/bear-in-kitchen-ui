import { getCollection } from 'astro:content';

export async function getRecipes() {
  const previewDrafts = import.meta.env.DEV || import.meta.env.INCLUDE_DRAFTS === 'true';
  return (await getCollection('recipes', ({ data }) => previewDrafts || !data.draft))
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf() || a.id.localeCompare(b.id, 'cs'));
}

export function recipeUrl(id: string) {
  return `/recipe/${id.split('/').map(encodeURIComponent).join('/')}/`;
}
