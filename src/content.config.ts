import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const recipes = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: './src/content/recipes',
    generateId: ({ entry }) => entry.replace(/\.json$/, ''),
  }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    draft: z.boolean().default(true),
    category: z.string().min(1),
    tags: z.array(z.string()).default([]),
    published: z.coerce.date(),
    photo: image().optional(),
    photoAlt: z.string().min(1),
    serves: z.number().int().positive(),
    minutes: z.number().int().positive(),
    difficulty: z.enum(['Snadné', 'Střední', 'Náročné']),
    ingredients: z.array(z.object({
      ingredientId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      name: z.string().min(1),
      quantity: z.number().positive().optional(),
      unit: z.string().default(''),
    })),
    steps: z.array(z.object({
      content: z.string().min(1),
      tip: z.boolean().default(false),
      photo: image().optional(),
      photoAlt: z.string().optional(),
    })),
  }).superRefine((recipe, context) => {
    if (!recipe.draft && recipe.ingredients.length === 0) {
      context.addIssue({ code: 'custom', path: ['ingredients'], message: 'A published recipe needs ingredients.' });
    }
    if (!recipe.draft && !recipe.steps.some(step => !step.tip)) {
      context.addIssue({ code: 'custom', path: ['steps'], message: 'A published recipe needs at least one instruction.' });
    }
  }),
});

export const collections = { recipes };
