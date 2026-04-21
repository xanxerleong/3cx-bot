// 🔥 載入套件
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

// 🌐 首頁（測試用，避免 Cannot GET /）
app.get('/', (req, res) => {
  res.send('✅ 3CX Bot is running');
});

// 🚀 主功能：抓 3CX 資料
app.get('/run', async (req, res) => {
  console.log('🔥 開始執行 3CX');

  const browser = await puppeteer.launch({
    headless: true, // Render 必須 true
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Render 必備
  });

  const page = await browser.newPage();

  try {
    // =========================
    // 1️⃣ 登入 3CX
    // =========================
    await page.goto('https://kkco-asiayo.3cx.com.tw:5271', {
      waitUntil: 'networkidle2'
    });

    // 👉 等 input 出現
    await page.waitForSelector('input');

    const inputs = await page.$$('input');

    // 👉 輸入帳號密碼
    await inputs[0].type('3012', { delay: 50 });
    await inputs[1].type('Xanxer910822@', { delay: 50 });

    // 👉 按登入
    await page.keyboard.press('Enter');

    // 👉 等頁面載入
    await new Promise(r => setTimeout(r, 5000));

    console.log('✅ 登入成功');

    // =========================
    // 2️⃣ 定義三個分機
    // =========================
    const queues = [
      { ext: '0300', url: 'https://kkco-asiayo.3cx.com.tw:5271/#/switchboard/queues/106' },
      { ext: '0301', url: 'https://kkco-asiayo.3cx.com.tw:5271/#/switchboard/queues/107' },
      { ext: '0302', url: 'https://kkco-asiayo.3cx.com.tw:5271/#/switchboard/queues/108' },
      { ext: '0310', url: 'https://kkco-asiayo.3cx.com.tw:5271/#/switchboard/queues/109' },
      { ext: '0700', url: 'https://kkco-asiayo.3cx.com.tw:5271/#/switchboard/queues/160' }
    ];

    const results = [];

    // =========================
    // 3️⃣ 逐個抓資料
    // =========================
    for (let q of queues) {
      console.log('👉 進入分機:', q.ext);

      await page.goto(q.url, { waitUntil: 'networkidle2' });

      // 👉 等資料出現
      await new Promise(r => setTimeout(r, 5000));

      // 👉 抓整頁文字
      const text = await page.evaluate(() => document.body.innerText);

      // =========================
      // 4️⃣ 解析數字（重點）
      // =========================
      // 範例：
      // Waiting Calls 0
      // Serviced Calls 37
      // Abandoned Calls 1
      // Average Waiting 00:00:21

      function getValue(label) {
        const regex = new RegExp(label + '\\s+(\\d+|\\d{2}:\\d{2}:\\d{2})');
        const match = text.match(regex);
        return match ? match[1] : '0';
      }

      const serviced = getValue('Serviced Calls');
      const abandoned = getValue('Abandoned Calls');
      const waiting = getValue('Average Waiting');

      results.push({
        ext: q.ext,
        serviced,
        abandoned,
        waiting
      });
    }

    // =========================
    // 5️⃣ 回傳 JSON
    // =========================
    await browser.close();

    console.log('✅ 完成');

    res.json(results);

  } catch (err) {
    console.error(err);
    await browser.close();
    res.send('❌ 錯誤: ' + err.message);
  }
});

// 🚀 Render 需要這個 PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
