const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

const USERNAME = '3012';
const PASSWORD = 'Xanxer910822@';
const LOGIN_URL = 'https://kkco-asiayo.3cx.com.tw:5271';

app.get('/', (req, res) => {
  res.send('✅ 3CX bot is running');
});

app.get('/run', async (req, res) => {
  let browser;

  try {
    console.log('🚀 啟動 puppeteer');

    // 🔥 關鍵：確保 Chrome 存在
    const browserFetcher = puppeteer.createBrowserFetcher();
    const revisionInfo = await browserFetcher.download(
      puppeteer.browserRevision
    );

    console.log('📦 Chrome 下載完成:', revisionInfo.executablePath);

    browser = await puppeteer.launch({
      headless: true,
      executablePath: revisionInfo.executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    await page.waitForSelector('input', { timeout: 15000 });

    const inputs = await page.$$('input');

    await inputs[0].type(USERNAME, { delay: 50 });
    await inputs[1].type(PASSWORD, { delay: 50 });

    await page.keyboard.press('Enter');

    await new Promise(r => setTimeout(r, 5000));

    res.json({
      status: 'OK',
      message: '登入成功'
    });

    await browser.close();

  } catch (err) {
    console.error(err);

    if (browser) await browser.close();

    res.status(500).send('❌ 錯誤: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
