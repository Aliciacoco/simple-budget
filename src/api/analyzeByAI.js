// src/api/analyzeByAI.js
export async function analyzeSpendingByAI(monthItems) {
  const prompt = `
你是一个记账分析专家，用户给你一个月的账单数据，请你分析消费习惯并输出如下格式内容：

一、逐项统计  
1. 外卖：共多少次，总金额多少元  
2. 超市采购：共多少次，总金额多少元  
3. 给家人/送礼/家庭支出：共多少次，总金额多少元  
4. 网购/会员类：共多少次，总金额多少元  
5. 固定花销（交通、保险、通讯、医疗等）：总金额多少元  
6. 本月总消费：xxx 元（详细列出构成）

二、生活习惯画像  
- 用简洁的话概括用户这个月的消费特征  
- 包括是否有刚需支出、人情支出、宠物支出、出差状态、极简状态等迹象  
- 可以适当推测用户生活状态，如：“外卖0次，说明最近可能在家做饭/别人做饭”  

三、一句话总结（有趣一点）  
用一句话总结用户的消费习惯，像段子一样即可。

数据如下：
${JSON.stringify(monthItems, null, 2)}

请用中文输出以上分析。
`;

  const res = await fetch('/api/analyze-by-ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_MOONSHOT_KEY}`
    },
    body: JSON.stringify({
      model: 'kimi-k2-0905-preview',
      messages: [
        { role: 'system', content: '你是一个生活习惯分析师，善于根据消费数据发现用户习惯' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })
  });

  const json = await res.json();
  const reply = json.choices?.[0]?.message?.content?.trim();
  return reply || '未能分析出结果';
}
