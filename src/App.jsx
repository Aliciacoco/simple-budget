import BudgetCard from './BudgetCard'; 
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import _ from 'lodash';

function App() {
  const [data, setData] = useState([]);
  const currentMonthRef = useRef(null);

  const fixedOrder = ['生活必要', '娱乐享受', '教育学习', '大额支出', '赠与'];

  useEffect(() => {
    if (currentMonthRef.current) {
      currentMonthRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function loadFromSupabase() {
      console.log("🚀 正在从 Supabase 读取数据...");
      const { data: rows, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("❌ 获取失败：", error.message);
        return;
      }

      const grouped = {};
      rows.forEach(row => {
        const key = `${row.year}-${row.month}`;
        if (!grouped[key]) grouped[key] = {};
        if (!grouped[key][row.title]) grouped[key][row.title] = [];

        grouped[key][row.title].push({
          id: row.id,
          text: row.text,
          amount: row.amount,
          status: row.status,
        });
      });

      const finalData = Object.entries(grouped).map(([key, cardsObj]) => {
        const [year, month] = key.split('-').map(Number);

        // 根据 fixedOrder 补全缺失的卡片类型
        const cards = fixedOrder.map(title => ({
          title,
          items: cardsObj[title] || []
        }));

        return { year, month, cards };
      });

      setData(finalData);
    }

    loadFromSupabase();
  }, []);

  const saveMonthDataToSupabase = useCallback(_.debounce(async (monthData) => {
    const { year, month, cards } = monthData;

    const { error: deleteError } = await supabase
      .from('budgets')
      .delete()
      .match({ year: Number(year), month: Number(month) });

    if (deleteError) {
      console.error("❌ 删除旧数据失败：", deleteError.message);
      return;
    }

    const rowsToInsert = [];
    cards.forEach(card => {
      card.items.forEach(item => {
        rowsToInsert.push({
          year,
          month,
          title: card.title,
          text: item.text,
          amount: parseFloat(item.amount) || 0,
          status: item.status,
          created_at: new Date().toISOString()
        });
      });
    });

    const { error: insertError } = await supabase.from('budgets').insert(rowsToInsert);
    if (insertError) {
      console.error("❌ 插入失败：", insertError.message);
    } else {
      console.log(`✅ 成功保存 ${year}年${month}月 的 ${rowsToInsert.length} 条数据`);
    }
  }, 500), []);

  const addNextMonth = () => {
    const newData = [...data];
    let year, month;

    if (newData.length === 0) {
      year = 2025;
      month = 9;
    } else {
      const last = newData[newData.length - 1];
      year = last.year;
      month = last.month;
      if (month === 12) {
        year++;
        month = 1;
      } else {
        month++;
      }
    }

    const newCards = fixedOrder.map(title => ({
      title,
      items: [{
        id: Date.now().toString() + Math.random().toString().slice(2, 6),
        text: '',
        amount: '',
        status: 'pending',
      }]
    }));

    const newMonthData = { year, month, cards: newCards };
    newData.push(newMonthData);
    setData(newData);
    saveMonthDataToSupabase(newMonthData);
  };

  const deleteMonth = async (index) => {
    const confirmDelete = window.confirm(`确定要删除 ${data[index].year}年${data[index].month}月 吗？`);
    if (!confirmDelete) return;

    const { year, month } = data[index];
    const { error } = await supabase.from('budgets').delete().match({ year, month });

    if (error) {
      console.error("❌ 删除失败：", error.message);
      return;
    }

    const newData = data.filter((_, i) => i !== index);
    setData(newData);
    console.log(`✅ 已删除 ${year}年${month}月 的数据`);
  };

  return (
    <div style={{ padding: '40px 80px' }}>
      {data.length === 0 && (
        <div style={{
          textAlign: 'center',
          color: '#999',
          fontSize: 18,
          marginTop: 40,
          fontStyle: 'italic'
        }}>
          当前没有任何月份数据，请点击下方“新增月份”开始记录吧！
        </div>
      )}

      {[...data].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month).map((monthData, i) => {
        const { year, month, cards } = monthData;
        const totalAll = cards.flatMap(c => c.items).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const now = new Date();
        const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

        return (
          <div key={`${year}-${month}`} ref={isCurrentMonth ? currentMonthRef : null} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h1>{year}年{month}月（总预算 ¥{totalAll}）</h1>
              <button
                onClick={() => deleteMonth(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  color: '#888',
                  cursor: 'pointer',
                }}
                title="删除该月份"
              >✖</button>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {cards.map((card, j) => (
                <BudgetCard
                  key={card.title}
                  title={card.title}
                  items={card.items}
                  totalAll={totalAll}
                  onUpdate={(updatedItems) => {
                    const oldItems = _.cloneDeep(data[i].cards[j].items);
                    if (!_.isEqual(oldItems, updatedItems)) {
                      const newData = _.cloneDeep(data);
                      newData[i].cards[j].items = updatedItems;
                      setData(newData);
                      console.log("📝 触发写入数据库");
                      saveMonthDataToSupabase(newData[i]);
                    } else {
                      console.log("🚫 没变化，不写入");
                    }
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}

      <button
        onClick={addNextMonth}
        style={{
          padding: '10px 24px',
          fontSize: 16,
          background: '#222',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          cursor: 'pointer',
          marginTop: 32,
        }}
      >
        ➕ 新增月份
      </button>
    </div>
  );
}

export default App;
