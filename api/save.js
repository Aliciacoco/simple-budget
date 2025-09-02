// api/save.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持 POST 方法' });
  }

  const newData = req.body;
  const filePath = path.join(process.cwd(), 'server', 'data.json');

  fs.writeFile(filePath, JSON.stringify(newData, null, 2), (err) => {
    if (err) {
      console.error('❌ 写入失败:', err);
      return res.status(500).json({ message: '保存失败' });
    }
    res.status(200).json({ message: '保存成功' });
  });
}
