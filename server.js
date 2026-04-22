const express = require('express');
const { chromium } = require('playwright');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

const USERNAME = '3012';
const PASSWORD = 'Xanxer910822@';
const BASE_URL = 'https://kkco-asiayo.3cx.com.tw:5271';

let latestResult = null;
let browserReady = false;

/**
 * 🧠 確保 Chromium 存在（Render 免費版關鍵）
 */
function ensureBrowser() {
  if (browserReady) return;

  console.log('📦 檢查 Chromium...');

  try {
    execSync('npx playwright install chromium', { stdio: 'inherit' });
    browserReady = true;
    console.log('✅ Chromium 安裝完成');
  } catch (e) {
    console.error('❌ Chromium 安裝失敗', e);
    throw e;
  }
}

/**
 * 🏠 首頁
 */
app.get('/', (req, res) => {
  res.send('✅ 3CX bot is running');
});

/**
 * 🚀 啟動任務（背景執行）
 */
app.get('/run', async (req, res) => {
  res.send('🚀 任務已啟動');

  (async () => {
    let browser;

    try {
      console.log('🔥 開始任務');

      // 👉 關鍵：確保瀏覽器
      ensureBrowser();

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

      // 👉 分機設定（你要的）
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

        const match = text.match(
          /\n(\d+)\s+(\d+)\s+(\d+)\s+\d+:\d+:\d+\s+(\d+:\d+:\d+)/
        );

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

/**
 * 📊 取得結果
 */
app.get('/result', (req, res) => {
  if (!latestResult) {
    return res.json({ status: '尚未完成' });
  }
  res.json(latestResult);
});

/**
 * 🚀 啟動 server
 */
app.listen(PORT, () => {
  console.log('🚀 Server running');
});
