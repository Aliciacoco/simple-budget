// api/data.js
import cloudbase from '@cloudbase/node-sdk'

console.log("✅ data.js 已部署")
const app = cloudbase.init({
  env: process.env.TCB_ENV_ID,
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY
})

const db = app.database()

export default async function handler(req, res) {
  try {
    const result = await db.collection('budgets').get();
    res.status(200).json(result.data);
  } catch (err) {
    console.error('❌ 数据读取失败:', err);
    // 关键：返回错误内容
    res.status(500).json({ error: '读取数据库失败', details: err.toString() });
  }
}

