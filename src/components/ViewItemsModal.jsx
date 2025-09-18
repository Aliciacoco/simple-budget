// ViewItemsModal.jsx
import React from 'react';
import { IoClose } from "react-icons/io5";

function ViewItemsModal({ onClose, items, updateItem, deleteItem, iconMap, title, total }) {
  // 关闭弹窗函数
  const handleOverlayClick = (e) => {
    // 阻止事件冒泡，确保点击蒙层不会关闭弹窗中的内容
    e.stopPropagation();
    onClose();  // 关闭弹窗
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',  // 蒙层背景
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000
      }}
      onClick={handleOverlayClick}  // 点击蒙层关闭弹窗
    >
      <div
        style={{
          border: "1px solid #e5e5e5", background: 'white', borderRadius: '36px', padding: '20px', maxWidth: '500px', width: '80%',
        }}
        onClick={(e) => e.stopPropagation()}  // 阻止点击弹窗内部关闭蒙层
      >

        <span style={{color:"#999"}}>{title}</span>
        <div style={{ marginBottom: '20px',fontWeight:'600'}}>
          ¥{total.toFixed(2)} {/* 显示总金额 */}
        </div>

        <div style={{ marginTop: '20px' }}>
          {/* 项目列表 */}
          {items.map((item, index) => (
            <div
              key={item.id ?? index}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                marginBottom: 12,
                boxSizing:'border-box',
                width: '100%',
              }}
            >
              {/* 分类图标 */}
              <span style={{ fontSize: 18 }}>
                {iconMap[item.iconCategory] || '📦'}
              </span>

              {/* 名称输入框 */}
              <input
                type="text"
                value={item.text}
                placeholder="事项"
                onChange={(e) => updateItem(index, 'text', e.target.value)}
                style={{
                  flex: 1, 
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid transparent',
                  backgroundColor: '#fff',
                  fontSize: 16,
                  color: '#333',
                  border: "1px solid #e5e5e5",
                  boxSizing:'border-box',
                  
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
                  updateItem(index, 'amount', val);
                }}
                style={{
                  minWidth: 60,
                  padding: '6px 10px',
                  borderRadius: 6,
                  backgroundColor: '#fff',
                  fontSize: 16,
                  color: '#333',
                  border: "1px solid #e5e5e5",
                  boxSizing:'border-box'
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
                  boxSizing:'border-box'
                }}
                title="删除"
              >
                <IoClose />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ViewItemsModal;
