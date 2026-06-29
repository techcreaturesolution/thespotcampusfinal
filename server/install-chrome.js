import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cacheDir = join(__dirname, '.cache', 'puppeteer');
console.log(`Installing Chrome to custom cache dir: ${cacheDir}`);

try {
  execSync(`npx puppeteer browsers install chrome`, {
    env: { ...process.env, PUPPETEER_CACHE_DIR: cacheDir },
    stdio: 'inherit'
  });
  console.log('Chrome installed successfully!');
} catch (error) {
  console.error('Failed to install Chrome:', error);
  process.exit(1);
}

