const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache
let bloxCache = null;
let bloxCacheTime = 0;
let gardenCache = null;
let gardenCacheTime = 0;

const CACHE_DURATION_MS = 2 * 60 * 1000;

app.use(express.static(path.join(__dirname, '/')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Scrape Blox Fruits stock
app.get('/api/blox-stock', async (req, res) => {
  const now = Date.now();
  if (bloxCache && now - bloxCacheTime < CACHE_DURATION_MS) {
    return res.json(bloxCache);
  }
  try {
    const response = await fetch('https://fruityblox.com/stock');
    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse table or elements holding stock info
    const data = [];
    // Cái này mình dựa vào cấu trúc trang, ví dụ các thẻ td trong bảng stock
    // Bạn có thể cần chỉnh selector nếu trang thay đổi

    $('table tbody tr').each((i, el) => {
      const tds = $(el).find('td');
      const name = $(tds[0]).text().trim();
      const stock = $(tds[1]).text().trim();
      data.push({ name, stock });
    });

    bloxCache = data;
    bloxCacheTime = now;
    res.json(data);
  } catch (error) {
    if (bloxCache) {
      return res.json(bloxCache);
    }
    res.status(500).json({ error: 'Không lấy được dữ liệu Blox Fruits' });
  }
});

// Scrape Grow a Garden stock
app.get('/api/garden-stock', async (req, res) => {
  const now = Date.now();
  if (gardenCache && now - gardenCacheTime < CACHE_DURATION_MS) {
    return res.json(gardenCache);
  }
  try {
    const response = await fetch('https://growagarden.gg/stocks');
    const html = await response.text();
    const $ = cheerio.load(html);

    const data = [];

    // Lấy từng stock item tương tự trên trang (thường bảng hoặc div)
    $('table tbody tr').each((i, el) => {
      const tds = $(el).find('td');
      const name = $(tds[0]).text().trim();
      const stock = $(tds[1]).text().trim();
      data.push({ name, stock });
    });

    gardenCache = data;
    gardenCacheTime = now;
    res.json(data);
  } catch (error) {
    if (gardenCache) {
      return res.json(gardenCache);
    }
    res.status(500).json({ error: 'Không lấy được dữ liệu Grow a Garden' });
  }
});

app.listen(PORT, () => {
  console.log(`Server chạy cổng ${PORT}`);
});
