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

// 🚀 啟動任務
app.get('/run', async (req, res) => {
  res.send('🚀 任務已啟動');

  (async () => {
    let browser;

    try {
      console.log('🔥 開始抓資料');

      browser = await puppeteer.launch({
        headless: true,
        executablePath: puppeteer.executablePath(), // ✅ 正確
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
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

      console.log('✅ 登入成功');

      // 👉 分機
      const queues = [
        { ext: '0300', id: 106 },
        { ext: '0301', id: 107 },
        { ext: '0302', id: 108 },
        { ext: '0310', id: 109 },
        { ext: '0700', id: 160 }
      ];

      let results = [];

      for (const q of queues) {

        console.log('👉 抓 ' + q.ext);

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

      latestResult = {
        status: "完成",
        data: results
      };

      console.log('✅ 全部完成');

      await browser.close();

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

// 📊 取得結果
app.get('/result', (req, res) => {
  if (!latestResult) {
    return res.json({ status: '尚未完成' });
  }
  res.json(latestResult);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running`);
});
