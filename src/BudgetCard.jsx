//引入usestate状态管理，useeffect监听状态变化
import { useState, useEffect, useRef } from 'react';
import isEqual from 'lodash/isEqual';
import { supabase } from '../lib/supabaseClient';
import { IoClose } from "react-icons/io5";



//引入实现拖拽排序的库组件
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import { reduce } from 'lodash';

//主组件，传入4个参数
function BudgetCard({ title, items, onUpdate, totalAll }) {
  
    //定义localItems是当前卡片的本地状态副本
  const [localItems, setLocalItems] = useState(items);

  const hasMounted = useRef(false);  // ⬅️ 首次挂载判断
  //监听localItems的变化
  useEffect(() => {
    if (hasMounted.current) {
      onUpdate(localItems);
    } else {
      hasMounted.current = true;
    }
  }, [localItems]);


// 新增项
const addItem = () => {
  setLocalItems([
    ...localItems,
    { text: '', amount: '', status: 'pending' } // ✅ 没有 id
  ]);
};

  //修改项
  const updateItem = (index, key, value) => {
    const newItems = [...localItems];
    const oldItem = localItems[index];

    // ✅ 只在值真正变化时再更新（避免无限循环）
    if (!isEqual(oldItem[key], value)) {
      newItems[index] = { ...oldItem, [key]: value };
      setLocalItems(newItems);
    }
    };

  //删除项
  const deleteItem = async (itemId) => {
    const { error } = await supabase.from('budgets').delete().eq('id', itemId);
    if (error) {
      alert('删除失败：' + error.message);
    } else {
      setLocalItems((prev) => prev.filter(item => item.id !== itemId));
    }
  };

  //修改状态
  const toggleStatus = (index) => {

    const newItems = [...localItems];
    //对被点击的那一项，也要深拷贝（创建一个新对象）
    const target = { ...newItems[index] }; 
    target.status = target.status === 'done' ? 'pending' : 'done';
    newItems[index] = target; // 替换为新对象
    setLocalItems(newItems);


  };
  //拖拽排序处理
  const handleDragEnd = (result) => {
    //从 result 中解构出：起始位置source和目标位置destination
    const { source, destination } = result;
    //如果元素被拖到列表外或起点和终点相同，不做处理
    if (!destination || source.index === destination.index) return;
    
    //创建localItems的副本
    const newItems = [...localItems];
    //从 newItems 中删除被拖动的那一项，[moved] 是解构写法，相当于：const moved = ...
    //splice() 返回的是被删除的项！
    const [moved] = newItems.splice(source.index, 1);
    //将刚刚删除的那一项 moved 插入到目标位置
    //把 moved 插入到目标位置，把 moved 插入到目标位置只插入
    newItems.splice(destination.index, 0, moved);
    setLocalItems(newItems);
  };

  const total = localItems.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );
  const percent = totalAll === 0 ? 0 : Math.round((total / totalAll) * 100);

  //不同类别卡片的背景色
  const cardColors = {
  '生活必要': '#ee852f', // 浅黄
  '娱乐享受': '#56CCF2', // 浅蓝
  '教育学习': '#9B51E0', // 紫色
  '大额支出': '#EB5757', // 红色
  '赠与':     '#27AE60', // 绿色
  };

  //不同类别卡片的字体色
  const fontColors = {
  '生活必要': '#ee852f', // 浅黄
  '娱乐享受': '#56CCF2', // 浅蓝
  '教育学习': '#9B51E0', // 紫色
  '大额支出': '#EB5757', // 红色
  '赠与':     '#27AE60', // 绿色
  };



  // 根据 title 获取主题色
  const cardColor = cardColors[title] || '#999';

  // 生成浅色背景（透明度 0.1）
  const bgColor = `${cardColor}1A`; // HEX + Alpha (1A ≈ 10%)



  return (
    //容器样式
    <div
      style={{
        background: bgColor,
        padding: 24,
        borderRadius: 36,
        maxWidth: 500,
        marginBottom: 32,
        color:cardColors[title] || '#333',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* 标题和百分比 */}
      <div style={{ 
        borderBottom: '0.5px solid #e5e5e5',
        paddingBottom: 2, 
        marginBottom: 2, 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
        }}
        >
        <h3>{title}</h3>
        <div
          style={{
            fontWeight: 'bold',
            textAlign: 'right',
            fontSize: 16,
          }}
        >
          {percent}%
        </div>
      </div>
      

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable-list">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {localItems.map((item, i) => (
                <Draggable
                  draggableId={String(item.id ?? i)}   // ✅ 强制转成字符串
                  index={i}
                  key={String(item.id ?? i)}           // ✅ key 也保持一致
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        marginBottom: 12,
                        ...provided.draggableProps.style,
                      }}
                    >
                      {/* status 按钮 */}
                      <span
                      {...provided.dragHandleProps}
                      onClick={() => toggleStatus(i)}
                      style={{
                        cursor: 'grab',
                        width: 18,
                        height: 18,
                        borderRadius: '80%',
                        // border: '1px solid #ddd',
                        backgroundColor: item.status === 'done' ? cardColors[title] : '#fff', // ✅ 动态主题色
                        display: 'inline-block',
                        userSelect: 'none',
                        opacity: 0.9,
                        transition: 'background-color 0.2s ease, border-color 0.2s ease',
                      }}
                      title="点击切换状态"
                    />


                      <input
                        type="text"
                        value={item.text}
                        placeholder="事项"
                        onChange={(e) =>
                          updateItem(i, 'text', e.target.value)
                        }
                        style={{ 
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: '1px solid rgb(255, 255, 255,0)',
                          backgroundColor: 'rgba(255, 255, 255)',
                          fontSize: 14,
                          color: '#333',
                          outline: 'none',
                          transition: 'border-color 0.2s', 
                        }}
                      />
                      <input
                        type="text"
                        step="0.01" // 允许小数，默认两位
                        inputMode="decimal" // 建议手机键盘带小数点（可选）
                        value={item.amount}
                        placeholder="金额"
                        onChange={(e) =>{
                          let val = e.target.value;
                          // ✅ 立即过滤掉所有非数字和小数点字符
                          val = val
                            .replace(/[^0-9.]/g, '')        // 移除除数字和点之外的字符
                            .replace(/\.{2,}/g, '.')        // 替换连续点为一个点
                            .replace(/^0+(\d)/, '$1')       // 去掉前导 0（保留小数点前的数字）
                            .replace(/^(\d*\.\d*).*$/, '$1'); // 保留一个小数点后的数字

                          updateItem(i, 'amount', val);
                        }}
                        style={{ 
                          width: 70,
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid rgb(255, 255, 255,0)',
                          backgroundColor: 'rgba(255, 255, 255)',
                          fontSize: 14,
                          color: '#333',
                          outline: 'none',
                          transition: 'border-color 0.2s',  }}
                      />
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
                  )}
                </Draggable>
              ))}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      

      {/* 添加按钮 */}
      <div
        onClick={addItem}
        style={{
          fontSize: 20,
          textAlign: 'center',
          color: '#bbb',
          cursor: 'pointer',
          marginTop: 12,
        }}
      >
        ＋
      </div>
    </div>
  );
}

export default BudgetCard;
