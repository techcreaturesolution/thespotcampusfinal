import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const generatePdfFromHtml = async (htmlContent) => {
  let browser;
  try {
    let puppeteer;
    let launchOptions = {};

    if (process.env.NODE_ENV === 'production') {
      puppeteer = (await import('puppeteer-core')).default;
      const chromium = (await import('@sparticuz/chromium')).default;
      
      launchOptions = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      };
    } else {
      // Force Puppeteer to look for the Chrome binary in the local cache dir we installed to
      // We resolve the cache directory relative to the file path to avoid process.cwd() mismatch on cloud environments like Render
      const cacheDir = join(__dirname, '..', '..', '.cache', 'puppeteer');
      process.env.PUPPETEER_CACHE_DIR = cacheDir;

      // Dynamic import to prevent ESM import hoisting from evaluating puppeteer before env variable is set
      puppeteer = (await import('puppeteer')).default;

      launchOptions = {
        headless: "new",
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote'
        ]
      };
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    // We wrap the html content in standard html tags to ensure proper rendering if it isn't already
    const srcDoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=794">
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              background: white; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;
    
    await page.setContent(srcDoc, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error("Puppeteer PDF generation error:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
