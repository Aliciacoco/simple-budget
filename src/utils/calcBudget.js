// 计算总预算和已花费
export function calcBudgetStats(cards) {
  const totalAll = cards.flatMap(c => c.items)
    .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const totalDone = cards.flatMap(c => c.items)
    .filter(item => item.status === 'done')
    .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return { totalAll, totalDone };
}
