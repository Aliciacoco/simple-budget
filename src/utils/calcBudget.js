// 计算总预算和已花费
export function calcBudgetStats(cards) {
  const totalDone = cards.flatMap(c => c.items)
    .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);


  return {totalDone };
}
