const puppeteer = require('puppeteer');
const express = require('express');
const app = express();

app.get('/run', async (req, res) => {
  console.log("🔥🔥🔥 正在執行最終版本");

  const browser = await puppeteer.launch({
    headless: false, // 成功後可改 true
    defaultViewport: null
  });

  const page = await browser.newPage();

  try {
    // =============================
    // 1️⃣ 登入 3CX
    // =============================
    await page.goto('https://kkco-asiayo.3cx.com.tw:5271', {
      waitUntil: 'networkidle2'
    });

    await page.waitForSelector('input');

    const inputs = await page.$$('input');

    if (inputs.length < 2) {
      throw new Error('❌ 找不到登入欄位');
    }

    await inputs[0].type('3012', { delay: 50 });
    await inputs[1].type('Xanxer910822@', { delay: 50 }); // 🔴請改成你的密碼

    await page.click('button');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('✅ 登入成功');

    // =============================
    // 2️⃣ 分機列表
    // =============================
    const queues = [
      { ext: '0300', url: 'https://kkco-asiayo.3cx.com.tw:5271/#/switchboard/queues/106' },
      { ext: '0301', url: 'https://kkco-asiayo.3cx.com.tw:5271/#/switchboard/queues/107' },
      { ext: '0302', url: 'https://kkco-asiayo.3cx.com.tw:5271/#/switchboard/queues/108' }
    ];

    let result = [];

    // =============================
    // 3️⃣ 抓資料
    // =============================
    for (let q of queues) {
      console.log('👉 抓分機', q.ext);

      await page.goto(q.url);

      // 等畫面出現關鍵字
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Serviced Calls');
      }, { timeout: 15000 });

      // 再等一下確保數字載入
      await new Promise(resolve => setTimeout(resolve, 3000));

      const data = await page.evaluate(() => {

        const text = document.body.innerText;
        const lines = text.split('\n');

        const headerIndex = lines.findIndex(line =>
          line.includes('Waiting Calls') &&
          line.includes('Serviced Calls')
        );

        if (headerIndex === -1) {
          return { serviced: '', abandoned: '', waiting: '' };
        }

        const valuesLine = lines[headerIndex + 1];

        if (!valuesLine) {
          return { serviced: '', abandoned: '', waiting: '' };
        }

        const values = valuesLine.split('\t').filter(v => v !== '');

        return {
          serviced: values[1] || '',
          abandoned: values[2] || '',
          waiting: values[4] || ''
        };
      });

      console.log(q.ext, data);

      result.push({
        ext: q.ext,
        serviced: data.serviced,
        abandoned: data.abandoned,
        waiting: data.waiting
      });
    }

    await browser.close();

    console.log('✅ 全部完成');

    res.json(result);

  } catch (err) {
    console.error('❌ 錯誤:', err.message);
    await browser.close();
    res.send('錯誤: ' + err.message);
  }
});

app.listen(3000, () => {
  console.log('🚀 http://localhost:3000/run');
});