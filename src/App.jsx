import BudgetCard from './BudgetCard'; 
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import _ from 'lodash';
import { formatBudgetData } from './utils/formatBudgetData';
import { calcBudgetStats } from './utils/calcBudget';
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";;


function App() {
  
  const fixedOrder = ['生活必要', '娱乐享受', '教育学习', '大额支出', '赠与'];
  const [monthData, setMonthData] = useState(null); // 当前月的数据
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const handlePrevMonth = () => {
    let y = currentYear;
    let m = currentMonth - 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    loadFromSupabase(y, m);
  };

  const handleNextMonth = () => {
    let y = currentYear;
    let m = currentMonth + 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
    loadFromSupabase(y, m);
  };

  const loadFromSupabase = async (y, m) => {
  console.log(`🚀 正在加载 ${y}年${m}月数据...`);
  const { data: rows, error } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("❌ 数据获取失败：", error.message);
    return;
  }

  const finalData = formatBudgetData(rows, fixedOrder, y, m);
  setMonthData(finalData);
  setCurrentYear(y);
  setCurrentMonth(m);
};

  useEffect(() => {
  const now = new Date();
  loadFromSupabase(now.getFullYear(), now.getMonth()+1);
}, []);


  // 保存某个月的预算数据到 Supabase（防抖节流版）
  const saveMonthDataToSupabase = useCallback(
    _.debounce(async (monthData) => {
      const { year, month, cards } = monthData;

      // 遍历每张卡片
      for (const card of cards) {
        // 遍历卡片内的每一项预算条目
        for (const item of card.items) {
          // 构造要写入数据库的记录对象
          const record = {
            id: item.id,                          // 每项唯一 ID
            year,                                 // 所属年份
            month,                                // 所属月份
            title: card.title,                    // 卡片类型（如 "生活必要"）
            text: item.text,                      // 预算条目内容
            amount: parseFloat(item.amount) || 0, // 金额（字符串转数字，默认为 0）
            status: item.status,                  // 状态（如 "pending" 或 "done"）
            position: item.position ?? 0          // 排序位置，默认 0
          };

          // 使用 upsert（有则更新，无则插入）写入数据库
          await supabase.from('budgets').upsert([record]);
        }
      }

      // 打印保存完成日志
      console.log(`✅ 保存完成`);
    }, 500), // 防抖延迟：500ms 内只保存一次
    []
  );


  return (
    <div style={{ width: '100%', padding: '0px 16px', boxSizing: 'border-box' }}>
      {monthData && (
        <div key={`${currentYear}-${currentMonth}`}>
          <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 100, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
            {/* 顶部：切换按钮 + 当前年月 */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16}}>
            <button onClick={handlePrevMonth} style={{width: 30, height: 30, fontSize:30,padding:0,backgroundColor:'white',outline: 'none', boxShadow: 'none', border: 'none',color: '#888'}}><IoIosArrowBack /></button>
            <h2 style={{ margin: 0 }}>{currentYear}年{currentMonth}月</h2>
            <button onClick={handleNextMonth} style={{width: 30, height: 30, fontSize:30,padding:0,backgroundColor:'white',outline: 'none', boxShadow: 'none', border: 'none',color: '#888'}}><IoIosArrowForward /></button>
          </div>

          {/* 月度汇总 */}
          <span style={{ color: '#888', fontSize: 16 }}>
            总预算 ¥{calcBudgetStats(monthData.cards).totalAll.toFixed(2)}，
            已花费 ¥{calcBudgetStats(monthData.cards).totalDone.toFixed(2)}
          </span>
          </div>
          

          {/* 卡片 */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {monthData.cards.map((card, j) => (
              <BudgetCard
                key={`${card.title}-${currentYear}-${currentMonth}`}
                title={card.title}
                items={[...card.items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))}
                totalAll={calcBudgetStats(monthData.cards).totalAll}
                onUpdate={(updatedItems) => {
                  const newData = _.cloneDeep(monthData);
                  newData.cards[j].items = updatedItems;
                  setMonthData(newData);
                  console.log("📝 触发写入数据库");
                  saveMonthDataToSupabase(newData);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
