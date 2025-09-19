import BudgetCard from './components/BudgetCard'; 
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import _ from 'lodash';
import { formatBudgetData } from './utils/formatBudgetData';
import { calcBudgetStats } from './utils/calcBudget';
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { analyzeSpendingByAI } from './api/analyzeByAI';

import { IoIosHome, IoIosCar, IoIosRestaurant } from 'react-icons/io'; // 导入react-icons图标




function App() {
  
  const fixedOrder = ['生活必要', '娱乐享受', '教育学习', '大额支出', '赠与'];
  const [monthData, setMonthData] = useState(null); // 当前月的数据
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [analysisResult, setAnalysisResult] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);



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
            position: item.position ?? 0,          // 排序位置，默认 0
            iconCategory: item.iconCategory,
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

  const totalDone = monthData ? calcBudgetStats(monthData.cards).totalDone : 0;
  
  return (
    <div style={{ width: '100%', padding: '0px 16px', boxSizing: 'border-box', }}>
      {monthData && (
        <div key={`${currentYear}-${currentMonth}`}>
          {/* 1. 顶部固定内容 */}
          <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 100,display: 'flex',flexDirection: 'column',alignItems: 'center', justifyContent: 'center', width: '100%',gap:'12px'}}>
          
          {/* 1.1 切换按钮 + 月份 */}
          <div style={{ width:'100%',display: 'flex', flexDirection: 'row', alignItems: 'center',justifyContent:'space-between'}}>
            {/* 左侧切换按钮 */}
            <button onClick={handlePrevMonth} style={{width: 30, height: 30, fontSize:30,padding:0,backgroundColor:'white',outline: 'none', boxShadow: 'none', border: 'none',color: '#999'}}><IoIosArrowBack /></button>
            {/* 中间部分 */}
            <div style={{display: 'flex',flexDirection: 'column',justifyContent:'center',alignItems:'center'}}>
              <span style={{ margin: 0 }}>{currentYear}年{currentMonth}月</span>
              <span style={{ fontSize: 24,fontWeight:600, }}>¥{calcBudgetStats(monthData.cards).totalDone.toFixed(2)}</span>
            </div>
            {/* 右侧切换按钮 */}
            <button onClick={handleNextMonth} style={{width: 30, height: 30, fontSize:30,padding:0,backgroundColor:'white',outline: 'none', boxShadow: 'none', border: 'none',color: '#999'}}><IoIosArrowForward /></button>
          </div>

          {/* 1.2 卡片预算占比条 */}
          <div style={{ width: '100%', }}>
            {totalDone === 0 ? (
              // 🟠 没数据时显示灰色分割线
              <div style={{
                height: 1,
                backgroundColor: '#eee',
                borderRadius: 1,
                width: '100%',
              }} />
            ) : (
              // 🟢 有数据时显示占比条
              <div style={{
                display: 'flex',
                height: 4,
                borderRadius: 2,
                overflow: 'hidden',
                
              }}>
                {monthData.cards.map(card => {
                  const total = card.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                  const percent = (total / totalDone) * 100;
                  const cardColors = {
                    '生活必要': '#ee852f',
                    '娱乐享受': '#56CCF2',
                    '教育学习': '#9B51E0',
                    '大额支出': '#EB5757',
                    '赠与': '#27AE60',
                  };
                  const color = cardColors[card.title] || '#ccc';
                  return (
                    <div
                      key={card.title}
                      style={{
                        width: `${percent}%`,
                        backgroundColor: color,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          </div>
          

          {/* 2. 卡片 */}
          <div style={{ display: 'flex', gap: 10, flexDirection:'column', marginTop: 16,width:'100%',justifyContent:'center', alignItems:'center' }}>
            {monthData.cards.map((card, j) => (
              <BudgetCard
                key={`${card.title}-${currentYear}-${currentMonth}`}
                title={card.title}
                items={[...card.items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))}
                totalAll={totalDone}
                
                onUpdate={(updatedItems, options ) => {
                  const newData = _.cloneDeep(monthData);
                  newData.cards[j].items = updatedItems;
                  
                  console.log("📝 触发写入数据库");
                  setMonthData(newData); // ✅ 始终更新 monthData，保持页面一致

                  if (!options.skipSave) {
                    saveMonthDataToSupabase(newData); // 🟡 有些更新不写数据库
                  }
                }}
              />
            ))}
          </div>

          {/* 3. 获取AI分析按钮 */}
          <button
            onClick={async () => {
              setLoadingAnalysis(true);// 设置加载状态为 true，表示开始分析
              try {
                const allItems = monthData.cards.flatMap(card => card.items.map(item => ({
                  text: item.text,
                  amount: item.amount,
                  iconCategory: item.iconCategory || '其他'
                })));
                //设置加载状态为 true，表示开始分析
                const result = await analyzeSpendingByAI(allItems);
                setAnalysisResult(result);
              } catch (err) {
                console.error("分析失败：", err);
                setAnalysisResult('分析失败，请稍后重试。');
              }
              // 分析结束，关闭 loading 状态
              setLoadingAnalysis(false);
            }}
            style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, fontSize: 14,color:"#666" , outline:"none",border:"none",}}
          >
            {loadingAnalysis ? '分析中...' : 'AI 分析这个月的消费习惯'}
          </button>

          {/* 4. 如果分析结果不为空，展示下面内容 */}
          {analysisResult && (
            <div
              style={{
                whiteSpace: 'pre-line',
                marginTop: 16,
                background: '#f9f9f9',
                padding: 16,
                borderRadius: 12,
                border: '1px solid #ddd',
                fontSize: 14
              }}
            >
              {analysisResult}
            </div>
          )}

          
        </div>
      )}
    </div>
  );
}

export default App;
