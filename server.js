const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/', (req, res) => {
  res.send('✅ 3CX Bot is running');
});

app.get('/run', async (req, res) => {
  console.log('🔥 開始執行');

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // 👉 先測試最簡單
    await page.goto('https://example.com');

    const title = await page.title();

    await browser.close();

    res.json({
      status: 'OK',
      title: title
    });

  } catch (err) {
    console.error('❌ 錯誤:', err);

    if (browser) await browser.close();

    res.status(500).send(err.toString());
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('🚀 Server running');
});
