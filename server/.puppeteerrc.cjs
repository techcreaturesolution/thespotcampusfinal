const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to a project-local directory.
  // This helps Render and other cloud hosts correctly cache and locate the Chrome binary.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
