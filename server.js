const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// 👉 你的帳密
const USERNAME = '3012';
const PASSWORD = 'Xanxer910822@';

// 👉 3CX
const LOGIN_URL = 'https://kkco-asiayo.3cx.com.tw:5271';

app.get('/', (req, res) => {
  res.send('✅ 3CX bot is running');
});

app.get('/run', async (req, res) => {
  let browser;

  try {
    console.log('🚀 開始執行');

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

    // 👉 進登入頁
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    // 👉 等輸入框
    await page.waitForSelector('input', { timeout: 15000 });

    const inputs = await page.$$('input');

    if (inputs.length < 2) {
      throw new Error('找不到登入欄位');
    }

    // 👉 輸入帳密
    await inputs[0].type(USERNAME, { delay: 50 });
    await inputs[1].type(PASSWORD, { delay: 50 });

    // 👉 登入
    await page.keyboard.press('Enter');

    // 👉 等登入完成
    await new Promise(r => setTimeout(r, 5000));

    console.log('✅ 登入成功');

    // 👉 測試先回傳成功（下一步再抓數據）
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
