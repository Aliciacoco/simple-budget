// 引入 React 核心功能
import { useState, useEffect, useRef } from 'react';
import isEqual from 'lodash/isEqual';
import { supabase } from '../../lib/supabaseClient';
import { IoClose } from "react-icons/io5";
import { IoIosAdd } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import { IoIosArrowUp } from "react-icons/io";
import AddItemModal from './AddItemModal'; // 弹窗组件
import { getCategoryFromText } from '../api/getCategoryFromText';// 导入分类函数

// 主组件 BudgetCard，接收 props：title、items、onUpdate、totalAll
function BudgetCard({ title, items, onUpdate, totalAll }) {
  const [showModal, setShowModal] = useState(false);         // 控制弹窗显示隐藏
  const [localItems, setLocalItems] = useState(items);       // 本地状态副本
  const [expanded, setExpanded] = useState(false); // 新增展开状态
  const skipOnUpdate = useRef(false);//创建一个“跳过标志”

  // 初始化时设置本地项（只运行一次）
  useEffect(() => {
    setLocalItems(items);
  }, []);

  const hasMounted = useRef(false);
  
  useEffect(() => {
  if (hasMounted.current) {
    if (skipOnUpdate.current) {
      skipOnUpdate.current = false; // 清除标志
      onUpdate(localItems, { skipSave: true }); // 👈 传个标志告诉父组件“这次不要保存数据库”
      return; // ⛔ 跳过这次的 onUpdate
    }
    onUpdate(localItems, {}); // 正常保存
  } else {
    hasMounted.current = true;
  }
}, [localItems]);


  // 添加新项
  const handleAddItem = async(newItem) => {
    const category = await getCategoryFromText(newItem.text);
    //增加一个 AI 自动分析得到的字段 iconCategory
    const updatedItem = { ...newItem, iconCategory: category };
    setLocalItems(prev => [...prev, updatedItem]);
  };

  // 修改某项的字段
  const updateItem = (index, key, value) => {
    const newItems = [...localItems];
    const oldItem = localItems[index];
    if (!isEqual(oldItem[key], value)) {
      newItems[index] = { ...oldItem, [key]: value };
      setLocalItems(newItems);
    }
  };

  // 删除某项
  const deleteItem = async (itemId) => {
    //向 Supabase 的 REST API 发出一个 HTTP 请求（如 DELETE /rest/v1/budgets?id=eq.xxx
    const { error } = await supabase.from('budgets').delete().eq('id', itemId);
    if (error) {
      alert('删除失败：' + error.message);
    } else {
      // 删除成功 → 标记跳过一次 onUpdate
      skipOnUpdate.current = true;

      const updated = localItems.filter(item => item.id !== itemId);
      const reIndexed = updated.map((item, idx) => ({
        ...item,
        position: idx,
      }));
      setLocalItems(reIndexed);
    }
  };

 

  // 总金额 & 占比计算
  const total = localItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const percent = totalAll === 0 ? 0 : Math.round((total / totalAll) * 100);

  // 主题色定义
  const cardColors = {
    '生活必要': '#ee852f',
    '娱乐享受': '#56CCF2',
    '教育学习': '#9B51E0',
    '大额支出': '#EB5757',
    '赠与':     '#27AE60',
  };
  

  const cardColor = cardColors[title] || '#999';
  const bgColor = `${cardColor}1A`; // 添加透明度，作为背景

  const iconMap = {
  '服装': '👗',
  '餐饮': '🍔',
  '住房': '🏠',
  '交通': '🚌',
  '日用': '🧻',
  '医疗': '💊',
  '美容': '💅',
  '美发': '💇‍♀️',
  '宠物': '🐶',
  '礼物': '🎁',
  '数码': '💻',
  '学习': '📚',
  '保险': '🛡️',
  '通讯': '📱',
  '运动': '🏃‍♂️',
  '旅游': '✈️',
  '娱乐': '🎮',
  '其他': '📦'
  };

  return (
    <div
      style={{
        background: bgColor,
        padding: 24,
        borderRadius: 36,
        maxWidth: 500,
        marginBottom: 32,
        color: cardColor,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* 卡片顶部：标题 + 添加按钮 */}
      <div style={{ borderBottom: '0.5px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 50 }}>
        <h3>{title}</h3>
          <div
            onClick={() => setShowModal(true)}
            style={{ width: 28, height: 28, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <IoIosAdd />
          </div>
      </div>

      {/* 显示项目总览摘要 */}
      <div style={{ fontSize: 14, color: '#555', marginTop: 8 }}>
        共 {localItems.length} 项，合计 ¥{total.toFixed(2)}
      </div>

      {/* 项目列表 */}
      {expanded && localItems.map((item, i) => (
        <div
          key={String(item.id ?? i)}
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          {/* 状态按钮 */}
          <span style={{ fontSize: 18 }}>
            {iconMap[item.iconCategory] || '📦'}
          </span>

          {/* 名称输入框 */}
          <input
            type="text"
            value={item.text}
            placeholder="事项"
            onChange={(e) => updateItem(i, 'text', e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid transparent',
              backgroundColor: '#fff',
              fontSize: 16,
              color: '#333',
              outline: 'none',
            }}
          />

          {/* 金额输入框 */}
          <input
            type="text"
            step="0.01"
            inputMode="decimal"
            value={item.amount}
            placeholder="金额"
            onChange={(e) => {
              let val = e.target.value;
              val = val
                .replace(/[^0-9.]/g, '')
                .replace(/\.{2,}/g, '.')
                .replace(/^0+(\d)/, '$1')
                .replace(/^(\d*\.\d*).*$/, '$1');
              updateItem(i, 'amount', val);
            }}
            style={{
              width: 70,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid transparent',
              backgroundColor: '#fff',
              fontSize: 16,
              color: '#333',
              outline: 'none',
            }}
          />

          {/* 删除按钮 */}
          <button
            onClick={() => deleteItem(item.id)}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#888',
              height: 20,
              width: 20,
              fontSize: 20,
              cursor: 'pointer',
              padding: 0,
            }}
            title="删除"
          >
            <IoClose />
          </button>
        </div>
      ))}

      {/* 添加展开/收起按钮 */}
      <div style={{ marginTop: 4, display: 'flex',justifyContent: 'center', }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            fontSize: 20,
            padding: 0,
            outline: 'none',
            border:'none',
            
          }}
        >
          {expanded ? <IoIosArrowUp /> : <IoIosArrowDown />}
        </button>
      </div>




      {/* 弹窗区域 */}
      {showModal && (
        <AddItemModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddItem}
        />
      )}
    </div>
  );
}

export default BudgetCard;