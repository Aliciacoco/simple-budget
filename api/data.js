// api/data.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'server', 'data.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Error reading data.json:', err);
      return res.status(500).json({ error: '无法读取数据文件' });
    }
    res.status(200).json(JSON.parse(data));
  });
}
