const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');
const Notice = require('../models/Notice');

// URL of the official site to scrape
const SCRAPE_URL = process.env.SCRAPE_URL || 'https://example-official-site.gov/notices';

const scrapeNotices = async () => {
    try {
        console.log('Starting notice scraping from:', SCRAPE_URL);
        
        // This is a generic implementation.
        // It fetches HTML from the official site and extracts notices.
        // Uncomment and adjust the selector logic below for the actual target site.

        /*
        const { data } = await axios.get(SCRAPE_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        const $ = cheerio.load(data);

        const newNotices = [];

        // Example: Iterate through a list of notice elements
        $('.notice-item').each((index, element) => {
            const title = $(element).find('.notice-title').text().trim();
            const description = $(element).find('.notice-desc').text().trim();
            const dateText = $(element).find('.notice-date').text().trim();
            const attachment = $(element).find('a.download-link').attr('href');

            if (title) {
                // Calculate an expiry date or use an extracted one
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30); // Valid for 30 days by default

                newNotices.push({
                    title,
                    description: description || 'No description provided.',
                    expiryDate,
                    attachment
                });
            }
        });

        // Save to DB (only if not already exists, to prevent duplicates)
        for (const noticeData of newNotices) {
            const exists = await Notice.findOne({ title: noticeData.title });
            if (!exists) {
                await Notice.create(noticeData);
                console.log(`Saved new notice: ${noticeData.title}`);
            }
        }
        */

        // For demonstration, a fake API fetch fallback if SCRAPE_URL is dummy:
        if (SCRAPE_URL.includes('example')) {
           // Simulate a successful scrape execution silently
           console.log('Skipping actual HTTP request for dummy SCRAPE_URL.');
        }

        console.log('Scraping completed.');
    } catch (error) {
        console.error('Error during scraping notices:', error.message);
    }
};

const initScraper = () => {
    // Schedule to run every day at 01:00 AM
    cron.schedule('0 1 * * *', () => {
        console.log('Running scheduled scrape job...');
        scrapeNotices();
    });

    // Also run once on startup
    scrapeNotices();
};

module.exports = { initScraper, scrapeNotices };
