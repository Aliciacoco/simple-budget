// src/api/analyzeByAI.js
export async function analyzeSpendingByAI(monthItems) {
  const prompt = `
你是一个记账分析专家，用户给你一个月的账单数据，请你分析消费习惯并输出如下格式内容：

一、这个月的消费总结  
- 用一句话总结用户这个月的消费行为，简洁有趣。例如：“你这个月的外卖吃得比自己做得还多，看来你真的是个‘外卖控’。”

二、每个分类的消费总结（简短有趣）  
1. 生活必要：  
例如：“生活必需品和外卖花费最多，你的胃袋可不小，尤其是X月X日那次大餐。”  
2. 娱乐享受：  
例如：“娱乐花费也不少，看来你是个不折不扣的‘快乐消费者’，X月X日的电影票就花了X元。”  
3. 教育学习：  
例如：“你的钱包和大脑一样，都在不断充实，X月X日的编程课让你花了X元。”  
4. 大额支出：  
例如：“大额支出集中在X月X日买的电视，花了X元，生活质量升级了。”  
5. 赠与：  
例如：“你的赠与支出真不少，X月X日给朋友的生日礼物花了X元，你的爱心不小。” 

数据如下：
${JSON.stringify(monthItems, null, 2)}

请用中文输出以上分析。
`;

  const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
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
