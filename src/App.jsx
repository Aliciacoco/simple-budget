//引入状态管理hook和子组件
import BudgetCard from './BudgetCard';
import { useState, useEffect } from 'react';


function App() {


  //典型的 React 前端向后端获取数据 的流程
  //声明一个状态 data，初始值是空数组
  const [data, setData] = useState([]);

  //渲染出卡片JSX结构后，自动执行请求数据
  useEffect(() => {
  //向本地的后端服务器发起请求，请求地址是：
  fetch('http://localhost:3001/data')
  //res 是 fetch() 的响应结果，是一个 Response 类型的对象，里面包含了data的url链接
  //res.json()就是把json文件拿出来
    .then(res => res.json())
    .then(json => {
      //// 赋予一个新的数组（地址 B）
      setData(json);
    })
    .catch(err => {
      console.error("❌ 获取数据失败:", err);
    });
  }, []);

  //保存函数
  const saveDataToBackend = (newData) => {
  fetch('http://localhost:3001/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newData),
  })
    .then((res) => res.json())
    .then((res) => {
      console.log('✅ 保存成功:', res.message);
    })
    .catch((err) => {
      console.error('❌ 保存失败:', err);
    });
};




  //新增月份
  const addNextMonth = () => {
    const newData = [...data];
    let newMonth = '';
    let newCards = [];

    //如果页面没有任何月份
    if(newData.length === 0){
      newMonth = '2025年9月';
      newCards = ['生活必要', '娱乐享受', '教育学习', '大额支出', '赠与'].map(title => ({
      title,
      items: [{
        id: Date.now().toString() + Math.random().toString().slice(2, 6),
        text: '',
        amount: '',
        status: 'pending',
      }],
    }));
    }
    else{
      //找到当前最后一个月份的数据对象
      const lastMonthData = newData[newData.length - 1];
      //从 month 字符串中提取出数字部分，使用正则 \d+（匹配连续数字），结果是数组，如'2025年9月' → ['2025', '9']
      const [yearStr, monthStr] = lastMonthData.month.match(/\d+/g);
      //将字符串形式的年份和月份转换为数字，方便做加法
      let year = parseInt(yearStr);
      let month = parseInt(monthStr);

      if (month === 12) {
        year++;
        month = 1;
      } else {
        month++;
      }

      newMonth = `${year}年${month}月`;
      //重点部分：复制卡片结构
      newCards = lastMonthData.cards.map(card => ({
        title: card.title,
        items: card.items.map(() => ({
          id: Date.now().toString() + Math.random().toString().slice(2, 6),
          text: '',
          amount: '',
          status: 'pending',
        }))
      }));
    
    }
//将新的月份和空卡片结构，添加到 newData 数组中。
    newData.push({
      month: newMonth,
      cards: newCards,
    });
    //更新状态，将 data 替换为新数组，触发组件重新渲染
    setData(newData);
    saveDataToBackend(newData);
};



  const deleteMonth = (index) => {
    const confirmDelete = window.confirm(`确定要删除 ${data[index].month} 吗？`);
    if (!confirmDelete) return;
    //使用 filter 过滤掉被删除的那一项
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
    saveDataToBackend(newData);
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
        const totalAll = monthData.cards
          .map(c => c.items)
          .flat()
          .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        return (
          <div key={i} style={{ marginBottom: 48 }}>
            {/* 月份标题 + 删除按钮 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12
            }}>
              <h1>{monthData.month}（总预算 ¥{totalAll}）</h1>
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
              >
                ✖
              </button>
            </div>
            {/* 渲染某一个月份下的所有卡片，并在卡片内有内容变动时，更新状态并保存到后端 */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {monthData.cards.map((card, j) => (
                <BudgetCard
                  key={j}
                  title={card.title}
                  items={card.items}
                  //******【重要】声明 onUpdate：父组件 App.jsx 中接收到变更
                  onUpdate={(updatedItems) => {
                    const newData = [...data];
                    newData[i].cards[j].items = updatedItems;
                    setData(newData);
                    saveDataToBackend(newData); // ✅ 这里统一保存
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
