const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

const USERNAME = '3012';
const PASSWORD = 'Xanxer910822@';
const BASE_URL = 'https://kkco-asiayo.3cx.com.tw:5271';

let latestResult = null;

app.get('/', (req, res) => {
  res.send('✅ 3CX bot is running');
});

app.get('/run', async (req, res) => {
  res.send('🚀 任務已啟動');

  (async () => {
    let browser;

    try {
      const browserFetcher = puppeteer.createBrowserFetcher();
      const revisionInfo = await browserFetcher.download(
        puppeteer.browserRevision
      );

      browser = await puppeteer.launch({
        headless: true,
        executablePath: revisionInfo.executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // 👉 登入
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      await page.waitForSelector('input');

      const inputs = await page.$$('input');
      await inputs[0].type(USERNAME);
      await inputs[1].type(PASSWORD);
      await page.keyboard.press('Enter');

      await new Promise(r => setTimeout(r, 5000));

      // 👉 分機列表
      const queues = [
        { ext: '0300', id: 106 },
        { ext: '0301', id: 107 },
        { ext: '0302', id: 108 },
        { ext: '0310', id: 109 }, // ⚠️ 確認 ID
        { ext: '0700', id: 160 }  // ⚠️ 確認 ID
      ];

      let results = [];

      for (const q of queues) {

        await page.goto(`${BASE_URL}/#/switchboard/queues/${q.id}`, {
          waitUntil: 'networkidle2'
        });

        await new Promise(r => setTimeout(r, 3000));

        const text = await page.evaluate(() => document.body.innerText);

        const match = text.match(/\n(\d+)\s+(\d+)\s+(\d+)\s+\d+:\d+:\d+\s+(\d+:\d+:\d+)/);

        if (match) {
          results.push({
            ext: q.ext,
            serviced: match[2],
            abandoned: match[3],
            waiting: match[4]
          });
        } else {
          results.push({
            ext: q.ext,
            serviced: '',
            abandoned: '',
            waiting: ''
          });
        }
      }

      latestResult = results;

      await browser.close();

    } catch (err) {
      latestResult = { error: err.message };
      if (browser) await browser.close();
    }
  })();
});

app.get('/result', (req, res) => {
  if (!latestResult) {
    return res.json({ status: '尚未完成' });
  }
  res.json(latestResult);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
