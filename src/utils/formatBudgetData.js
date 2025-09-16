export function formatBudgetData(rows, fixedOrder, year, month) {
  // 按年月过滤出当月数据
  const filteredRows = rows.filter(row => row.year === year && row.month === month);

  // 分组卡片
  const cardsObj = {};
  for (const row of filteredRows) {
    if (!cardsObj[row.title]) cardsObj[row.title] = [];
    cardsObj[row.title].push({
      id: row.id,
      text: row.text,
      amount: row.amount,
      status: row.status,
      position: row.position ?? 0,
      iconCategory: row.iconCategory,
    });
  }

  // 组装成完整结构，补齐 5 类卡片
  const cards = fixedOrder.map(title => ({
    title,
    items: cardsObj[title] || []
  }));

  return { year, month, cards };
}
