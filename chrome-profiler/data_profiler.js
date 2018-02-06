const fs = require('fs');
const puppeteer = require('puppeteer');

const sleep = n => new Promise(resolve => setTimeout(resolve, n));

const url = 'http://localhost:9000';
const inst_api_url = 'https://api.apis.guru/v2/specs/instagram.com/1.0.0/swagger.yaml';
const crm_api_url = 'https://api.apis.guru/v2/specs/data2crm.com/1/swagger.yaml';

(async function() {
    const chrome = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await chrome.newPage();
        await testPage(page);

    } catch (err) {
        console.error(err);
    } finally {
        console.log('Exit from profiling!');
        await chrome.close();
    }

    // Function to test page performance
    async function testPage(page) {
        const client = await page.target().createCDPSession();
        await client.send('Network.enable');
        await client.send('Performance.enable');
        await client.send('Profiler.enable');
        await client.send('HeapProfiler.enable');

        const profile = `./profiling-data/profile-${Date.now()}.json`;
        await page.tracing.start({path: profile});

        await page.goto(url, {waitUntil: 'networkidle2'});

        await page.focus('body > redoc > div > div.api-content > operations-list > div > div:nth-child(1) > operation:nth-child(2) > div > div.operation-content > h2 > a');
        await page.click('body > redoc > div > div.api-content > operations-list > div > div:nth-child(1) > operation:nth-child(2) > div > div.operation-content > h2 > a');

        await page.focus('body > redoc > div > div.api-content > operations-list > div > div:nth-child(1) > operation:nth-child(4) > div > div.operation-content > params-list > header > span')
        await sleep(2000);

        await page.focus('body > redoc > div > div.api-content > operations-list > div > div:nth-child(1) > operation:nth-child(4) > div > div.operation-content > responses-list > zippy:nth-child(2) > div > div.zippy-title > span.zippy-indicator')
        await page.click('body > redoc > div > div.api-content > operations-list > div > div:nth-child(1) > operation:nth-child(4) > div > div.operation-content > responses-list > zippy:nth-child(2) > div > div.zippy-title > span.zippy-indicator')
        await sleep(2000)

        await page.focus('#schema-url-input')
        await page.type('#schema-url-input', inst_api_url);

        await page.waitForSelector('#schema-url-form > button');
        await page.click('#schema-url-form > button');
        await page.waitForNavigation({waitUntil: 'networkidle2'})

        await page.focus('body > redoc > div > div.api-content > api-info > div > p.download-openapi > a')
        await page.click('body > redoc > div > div.api-content > api-info > div > p.download-openapi > a')
        await sleep(5000);

        await page.focus('#schema-url-input')
        await page.click('#schema-url-input')
        await page.keyboard.down('Control');
        await page.keyboard.down('A');
        await page.keyboard.up('A');
        await page.keyboard.up('Control');
        await page.type('#schema-url-input', crm_api_url);
        await page.waitForSelector('#schema-url-form > button');
        await page.click('#schema-url-form > button');
        await page.waitForNavigation({waitUntil: 'networkidle2'})

        await page.tracing.stop();
    };

})();