#!/usr/bin/env node
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper function to sanitize folder names.
function sanitizeFolderName(name) {
  // Replace spaces with underscores and remove any non-alphanumeric (or underscore) characters.
  return name.replace(/\s+/g, '_').replace(/[^\w_]/g, '');
}

(async () => {
  // Load chapters.json; ensure this file is in the same directory.
  const chapters = JSON.parse(fs.readFileSync('chapters.json', 'utf8'));

  // Launch Puppeteer.
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  const page = await browser.newPage();

  // Set a user agent.
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
  );

  // Explicitly set cookies (update/add additional cookies as needed).
  const cookies = [
    {
      name: 'JSESSIONID',
      value: '',
      domain: 'mole.haynes.com',
      path: '/',
      httpOnly: true,
      secure: true,
    },
    {
      name: '_shopify_y',
      value: '',
      domain: 'mole.haynes.com',
      path: '/',
      httpOnly: false,
      secure: true,
    },
    // Add any other necessary cookies here.
  ];
  await page.setCookie(...cookies);

  // Loop over each chapter with a counter for numbering.
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    // Format chapter number as 2 digits (01, 02, etc.)
    const chapterNumber = String(i + 1).padStart(2, '0');
    // Sanitize the chapter title.
    const sanitizedTitle = sanitizeFolderName(chapter.chapter_title);
    const chapterFolderName = `${chapterNumber}_${sanitizedTitle}`;

    // Create folder for the chapter if it doesn't exist.
    if (!fs.existsSync(chapterFolderName)) {
      fs.mkdirSync(chapterFolderName);
    }
    console.log(`Processing Chapter ${chapterNumber}: ${chapter.chapter_title}`);

    // Iterate through each page in the chapter.
    for (const p of chapter.pages) {
      const pageNum = p.page_num;
      const pageTitleClean = sanitizeFolderName(p.page_title);
      // Construct the full URL (adjust base URL if necessary).
      const targetUrl = "https://mole.haynes.com" + p.url;
      console.log(`  Navigating to: ${targetUrl}`);

      try {
        await page.goto(targetUrl, { timeout: 150000 });
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 15000)));
        //await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 150000 });
        // Extra wait time for images to load.
      } catch (error) {
        console.log(`    Error navigating to ${targetUrl}: ${error}`);
        continue; // Skip this page if navigation fails.
      }
      console.log(`  Final URL: ${page.url()}`);

      // Define the output PDF filename.
      const pdfPath = path.join(chapterFolderName, `${pageNum}_${pageTitleClean}.pdf`);
      try {
        await page.pdf({ path: pdfPath, format: 'A4' });
        console.log(`  PDF generated: ${pdfPath}`);
      } catch (error) {
        console.log(`    Error generating PDF for ${targetUrl}: ${error}`);
      }
    }
  }

  await browser.close();
  console.log("All chapters processed.");
})();
