export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.VITE_MOONSHOT_KEY; // 🔐 从环境变量中读取

  try {
    const moonshotRes = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: req.body.messages,
        temperature: 0.2
      })
    });

    const data = await moonshotRes.json();

    if (moonshotRes.ok) {
      res.status(200).json(data);
    } else {
      res.status(moonshotRes.status).json({ error: data });
    }
  } catch (err) {
    console.error('调用 Moonshot 出错:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
