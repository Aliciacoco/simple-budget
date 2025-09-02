// api/save.js
import cloudbase from '@cloudbase/node-sdk'

const app = cloudbase.init({
  env: process.env.TCB_ENV_ID,
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY,
})

const db = app.database()
const collection = db.collection('budgets')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' })
  }

  const newData = req.body

  try {
    // 替换整份 budgets 数据
    // 1. 先删除原来的数据
    const old = await collection.where({}).get()
    const deletePromises = old.data.map((doc) =>
      collection.doc(doc._id).remove()
    )
    await Promise.all(deletePromises)

    // 2. 批量插入新数据
    const insertPromises = newData.map((doc) => collection.add(doc))
    await Promise.all(insertPromises)

    res.status(200).json({ message: '✅ 数据已保存至腾讯云数据库' })
  } catch (err) {
    console.error('❌ 保存失败:', err)
    res.status(500).json({ error: '保存失败' })
  }
}
