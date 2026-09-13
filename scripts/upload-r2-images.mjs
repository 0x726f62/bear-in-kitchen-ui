import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const bucket = process.argv[2];
if (!bucket) throw new Error('Usage: node scripts/upload-r2-images.mjs <bucket-name>');

const directory = 'src/assets/recipes';
const images = (await readdir(directory)).filter(name => /\.(?:jpe?g|png|webp|avif)$/i.test(name)).sort();
const contentTypes = { '.avif': 'image/avif', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
for (const image of images) {
  const extension = image.slice(image.lastIndexOf('.')).toLocaleLowerCase();
  const result = spawnSync('wrangler', ['r2', 'object', 'put', `${bucket}/recipes/${image}`, '--file', `${directory}/${image}`, '--content-type', contentTypes[extension], '--remote'], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Uploaded ${images.length} images to R2 bucket ${bucket}.`);
