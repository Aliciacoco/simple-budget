// 引入 React 核心功能
import { useState, useEffect, useRef } from 'react';
import isEqual from 'lodash/isEqual';
import { supabase } from '../../lib/supabaseClient';
import { IoClose } from "react-icons/io5";
import { IoIosAdd } from "react-icons/io";
import AddItemModal from './AddItemModal'; // 新增弹窗组件
import ViewItemsModal from './ViewItemsModal'; // 显示弹窗组件
import { getCategoryFromText } from '../api/getCategoryFromText';// 导入分类函数
import loadingGif from '../../public/images/loading.gif'

// 主组件 BudgetCard，接收 props：title、items、onUpdate、totalAll
function BudgetCard({ title, items, onUpdate, totalAll }) {
  const [showModal, setShowModal] = useState(false);         // 控制新增弹窗显示隐藏
  const [showViewItemsModal, setShowViewItemsModal] = useState(false);         // 控制查看弹窗显示隐藏
  const [localItems, setLocalItems] = useState(items);       // 本地状态副本
  const [expanded, setExpanded] = useState(false); // 新增展开状态
  const skipOnUpdate = useRef(false);//创建一个“跳过标志”
  const [notification, setNotification] = useState(null);  // 新增提示框状态



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
    // 设置提示框信息
    setNotification({
      icon: loadingGif, 
      text: newItem.text,
      amount: newItem.amount,
    });

    const category = await getCategoryFromText(newItem.text);
    //增加一个 AI 自动分析得到的字段 iconCategory
    const updatedItem = { ...newItem, iconCategory: category };
    setLocalItems(prev => [...prev, updatedItem]);
  
    // 更新图标
    setNotification((prev) => ({
      ...prev,
      icon: category ? iconMap[category] : '📦', // 根据分类设置图标
      
    }));
    console.log("Icon:", iconMap[category]); // 调试，确保图标正确

    // 3秒后清除提示框
    setTimeout(() => {
      setNotification(null);
    }, 3000);
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
  const bgColor = `#fff`; // 添加透明度，作为背景

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
    <div onClick={() => setShowViewItemsModal(true)} 
      style={{
        padding: 20,
        borderRadius: 36,
        maxWidth: 360,
        marginBottom: 8,
        color: cardColor,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        border: "1px solid #e5e5e5",
        width:'100%',
      }}
    >


      {/* 卡片顶部：标题 + 添加按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',color:"#999"}}>
        <span>{title}（{percent}%）</span>
          <div
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡，避免触发卡片的 onClick 事件
              setShowModal(true); // 显示新增项弹窗
            }}
            style={{ width: 28, height: 28, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <IoIosAdd />
          </div>
      </div>

      {/* 显示项目总览摘要 */}
      <div style={{display: 'flex',alignItems: 'center',}}>
        <div 
        style={{ fontSize: 24, fontWeight:'600',color: '#555', color: cardColor}}>
          ¥{total.toFixed(2)}
        </div>

        {/* 新增成功提示 */}
        {notification && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              backgroundColor: '#f5f5f5',
              borderRadius: 12,
              marginLeft: 20,
              color: '#333',
              fontSize: 14,
            }}
          >
            {/* 判断是否为图片路径，若是图片路径则使用 <img />，否则使用 <span /> */}
            <span style={{ fontSize: 18, marginRight: 8 }}>
              {typeof notification.icon === 'string' && notification.icon.endsWith('.gif') ? (
                <img src={notification.icon} alt="icon" style={{ width: 18, height: 18 }} />
              ) : (
                notification.icon || '📦' // 如果是字符，直接用 span 渲染
              )}
            </span>

            <span>{notification.text} ¥{notification.amount}</span>
          </div>
        )}

      </div>
      

      

      {/* 显示弹窗区域 */}
      {showViewItemsModal && (
        <ViewItemsModal
          onClose={() => setShowViewItemsModal(false)} // 关闭弹窗
          items={localItems} // 传递当前卡片的所有 items
          updateItem={updateItem} // 传递修改项的函数
          deleteItem={deleteItem} // 传递删除项的函数
          iconMap={iconMap} // 传递分类图标
          title={title} // 传递卡片的 title
          total={total} // 传递计算的总金额
        />
      )}







      {/* 新增弹窗区域 */}
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