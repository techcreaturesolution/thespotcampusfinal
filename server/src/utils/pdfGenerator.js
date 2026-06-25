import { join } from 'path';

export const generatePdfFromHtml = async (htmlContent) => {
  // Force Puppeteer to look for the Chrome binary in the local cache dir we installed to
  process.env.PUPPETEER_CACHE_DIR = join(process.cwd(), '.cache', 'puppeteer');

  // Dynamic import to prevent ESM import hoisting from evaluating puppeteer before env variable is set
  const puppeteer = (await import('puppeteer')).default;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
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
