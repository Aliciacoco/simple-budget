import BudgetCard from './BudgetCard';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import _ from 'lodash'; 
import { useRef } from 'react';

function App() {
  const [data, setData] = useState([]);
  //它在组件重新加载时，默认是 false
  const hasMountedRef = useRef(false);

  useEffect(() => {
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
        return {
          year,
          month,
          cards: Object.entries(cardsObj).map(([title, items]) => ({
            title,
            items,
          }))
        };
      });

      setData(finalData);
    }

    loadFromSupabase();

  }, []);

  // 将某一个“月份”的预算数据，保存到 Supabase 数据库中
  //_.debounce(...)lodash 的节流函数，等你停止调用 500ms 后再执行（避免你疯狂点输入框，每一下都写数据库）。
  //useCallback(...)：避免每次渲染都创建新函数引用
  const saveMonthDataToSupabase = useCallback(_.debounce(async (monthData) => {
    //这个函数接收一个 monthData 参数，这里怎么不把card里面的东西写出来？要不怎么知道card里面有什么东西？？？
    const { year, month, cards } = monthData;

    // 步骤 1：删除该月旧数据
    //这一步直接把 budgets 表中 year=2025 && month=9 的所有记录删除。
    const { error: deleteError } = await supabase
      .from('budgets')
      .delete()
      .match({ year: Number(year), month: Number(month) });

    if (deleteError) {
      console.error("❌ 删除旧数据失败：", deleteError.message);
      return;
    } else {
      console.log(`🗑️ 已删除 ${year}年${month}月 的旧数据`);
    }

    // 2. 生成插入数据
    //将你的每张卡片里的每一条预算条目，转换为数据库要插入的格式。
    //要把所有信息转换成一行行的数据row
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

    // 3. 插入新数据
    //向 Supabase 插入数据后，把返回的 error 拿出来，改名叫 insertError，方便下面判断是否出错
    const { error: insertError } = await supabase.from('budgets').insert(rowsToInsert);
    if (insertError) {
      console.error("❌ 插入失败：", insertError.message);
    } else {
      console.log(`✅ 成功保存 ${year}年${month}月 的 ${rowsToInsert.length} 条数据`);

      // 4. 查询当前该月数据库记录总数
      //为了验证新数据有没有插入成功，再查一遍这个月的数据总数。
      const { data: checkData, error: checkError } = await supabase
        .from('budgets')
        .select('*')
        .match({ year: Number(year), month: Number(month) });

      if (checkError) {
        console.error("⚠️ 查询验证失败：", checkError.message);
      } else {
        console.log(`📊 当前 Supabase 中 ${year}年${month}月 共 ${checkData.length} 条`);
      }
    }
  }, 500), []); // ✅ 节流 500ms，避免重复写入

  // ➕ 新增月份
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

    const newCards = ['生活必要', '娱乐享受', '教育学习', '大额支出', '赠与'].map(title => ({
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
    saveMonthDataToSupabase(newMonthData); // ✅ 插入新增月份数据
  };

  // ❌ 删除月份
  const deleteMonth = async (index) => {
    const confirmDelete = window.confirm(`确定要删除 ${data[index].year}年${data[index].month}月 吗？`);
    if (!confirmDelete) return;

    const { year, month } = data[index];

    const { error } = await supabase
      .from('budgets')
      .delete()
      .match({ year: Number(year), month: Number(month) }); // ✅ 强制类型匹配

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

      {data.map((monthData, i) => {
        const { year, month, cards } = monthData;
        const totalAll = cards.flatMap(c => c.items).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        return (
          <div key={`${year}-${month}`} style={{ marginBottom: 48 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12
            }}>
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
                  key={j}
                  title={card.title}
                  items={card.items}


                  onUpdate={(updatedItems) => {
                    const oldItems = _.cloneDeep(data[i].cards[j].items);

                    // ✅ 只在值发生实际变化时才写入
                    //这里用了 lodash 的 _.isEqual(a, b) 来判断两个对象或数组是否“值上完全一样”
                    if (!_.isEqual(oldItems, updatedItems)) {
                      const newData = [...data];
                      newData[i].cards[j].items = updatedItems;
                      setData(newData);

                      // ✅ 判断有变化才触发写数据库
  if (!_.isEqual(oldItems, updatedItems)) {
    console.log("📝 触发写入数据库");
    saveMonthDataToSupabase(newData[i]);
  } else {
    console.log("🚫 没变化，不写入");
  }
                    }
                  }}

                  
                  totalAll={totalAll}
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
