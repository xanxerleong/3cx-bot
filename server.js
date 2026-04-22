const express = require('express');
const { chromium } = require('playwright');

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
      console.log('🔥 Playwright 啟動');

      browser = await chromium.launch({
        headless: true
      });

      const page = await browser.newPage();

      // 👉 登入
      await page.goto(BASE_URL);

      await page.waitForSelector('input');

      const inputs = await page.$$('input');

      await inputs[0].fill(USERNAME);
      await inputs[1].fill(PASSWORD);

      await page.keyboard.press('Enter');

      await page.waitForTimeout(5000);

      console.log('✅ 登入成功');

      // 👉 分機（記得確認 ID）
      const queues = [
        { ext: '0300', id: 106 },
        { ext: '0301', id: 107 },
        { ext: '0302', id: 108 },
        { ext: '0310', id: 109 },
        { ext: '0700', id: 110 }
      ];

      let results = [];

      for (const q of queues) {

        console.log('👉 抓 ' + q.ext);

        await page.goto(`${BASE_URL}/#/switchboard/queues/${q.id}`);

        await page.waitForTimeout(3000);

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

      latestResult = {
        status: "完成",
        data: results
      };

      await browser.close();

      console.log('✅ 完成');

    } catch (err) {
      console.error(err);

      latestResult = {
        status: "錯誤",
        error: err.message
      };

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
  console.log('🚀 Server running');
});
