const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

let latestResult = null; // 👉 存結果

app.get('/', (req, res) => {
  res.send('✅ 3CX bot is running');
});

// 🚀 啟動抓資料（不等待）
app.get('/run', async (req, res) => {
  res.send('🚀 任務已啟動');

  (async () => {
    let browser;

    try {
      console.log('🔥 背景開始抓');

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

      await page.goto('https://example.com');

      latestResult = {
        time: new Date(),
        status: '完成'
      };

      await browser.close();

      console.log('✅ 背景完成');

    } catch (err) {
      console.error(err);
      latestResult = { error: err.message };
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
  console.log(`🚀 Server running on port ${PORT}`);
});
