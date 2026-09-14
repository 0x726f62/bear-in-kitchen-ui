import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
const site = process.env.SITE_URL;

export default defineConfig({
  site,
  output: 'static',
  adapter: cloudflare({ imageService: 'compile', prerenderEnvironment: 'node' }),
  integrations: site ? [sitemap()] : [],
  vite: { plugins: [tailwindcss()] },
});
