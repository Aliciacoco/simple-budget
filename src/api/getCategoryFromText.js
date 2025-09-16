export async function getCategoryFromText(text) {
  const prompt = `请判断“${text}”属于以下哪个类别：服装、餐饮、住房、交通、日用、医疗、美容、美发、宠物、礼物、数码、学习、保险、通讯、运动、旅游、娱乐、其他。只返回类别名称，不要解释。`;

  try {
    const res = await fetch('/api/analyze-by-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_MOONSHOT_KEY}` // 放到.env文件中管理
      },
      body: JSON.stringify({
        model: 'kimi-k2-0905-preview',
        messages: [
          { role: 'system', content: '你是一个消费分类助手' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });

    const json = await res.json();

    if (!res.ok) {
      console.error("🚨 Moonshot API 错误：", res.status, json);
      return '其他';
    }

    const reply = json.choices?.[0]?.message?.content?.trim();
    return reply || '其他';

  } catch (err) {
    console.error("❌ Moonshot API 调用失败：", err);
    return '其他';
  }
}
