//引入usestate状态管理，useeffect监听状态变化
import { useState, useEffect, useRef } from 'react';
import isEqual from 'lodash/isEqual';



//引入实现拖拽排序的库组件
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';

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


  //新增
  const addItem = () => {
    setLocalItems([
      ...localItems,
      { id: Date.now().toString(), text: '', amount: '', status: 'pending' },
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

  //删除
  const deleteItem = (index) => {
    const newItems = localItems.filter((_, i) => i !== index);
    setLocalItems(newItems);
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

  return (
    <div
      style={{
        background: '#fffbe7',
        padding: 16,
        borderRadius: 12,
        maxWidth: 500,
        marginBottom: 32,
      }}
    >
      <h2>{title}</h2>

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
                        marginBottom: 8,
                        ...provided.draggableProps.style,
                      }}
                    >
                      {/* 拖动手柄绑定在 status 按钮 */}
                      <span
                        {...provided.dragHandleProps}
                        onClick={() => toggleStatus(i)}
                        style={{
                          cursor: 'grab',
                          fontSize: 20,
                          width: 24,
                          textAlign: 'center',
                          userSelect: 'none',
                          opacity: 0.9,
                        }}
                        title="拖动排序"
                      >
                        {item.status === 'done' ? '✅' : '⭕'}
                      </span>

                      <input
                        type="text"
                        value={item.text}
                        placeholder="事项"
                        onChange={(e) =>
                          updateItem(i, 'text', e.target.value)
                        }
                        style={{ flex: 1 }}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.amount}
                        placeholder="金额"
                        onChange={(e) =>
                          updateItem(i, 'amount', Number(e.target.value))
                        }
                        style={{ width: 80 }}
                      />
                      <button
                        onClick={() => deleteItem(i)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#888',
                          fontSize: 20,
                          cursor: 'pointer',
                        }}
                        title="删除"
                      >
                        ✖
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

      {/* 总额与占比 */}
      <div
        style={{
          marginTop: 16,
          fontWeight: 'bold',
          textAlign: 'right',
          fontSize: 16,
        }}
      >
        总计：¥{total}（占比 {percent}%）
      </div>

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
