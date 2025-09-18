//引入 React 以及 useState 钩子
import { FaCheck } from "react-icons/fa6";
import React, { useState, useEffect } from 'react';  // 确保这里导入了 useEffect



//onClose()：关闭弹窗
//onSubmit(item)：提交表单数据（新增一条预算条目）
function AddItemModal({ onClose, onSubmit }) {
    //定义两个输入框的状态
    const [text, setText] = useState('');
    const [amount, setAmount] = useState('');
    
    //提交处理逻辑
    const handleSubmit = () => {
        const num = Number(amount);
        if (isNaN(num) || num <= 0) {
            alert('请输入大于 0 的金额');
            return;
        }
        //这个onsubmit和上面传入的是什么区别？目的是什么
        onSubmit({ 
            id: crypto.randomUUID(), //生成唯一ID
            text,
            amount: parseFloat(amount), //转换为数字，默认0
            status: 'pending', //默认状态为待处理
            position: 0 
        });
        onClose(); //提交后关闭弹窗
    }

    useEffect(() => {
      // 打开弹窗时禁用背景滚动
      document.body.style.overflow = 'hidden';

      // 关闭弹窗时恢复背景滚动
      return () => {
        document.body.style.overflow = 'auto';
      };
    }, []); // 只在组件挂载和卸载时执行

    return ( 
  // 外层遮罩层
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100
  }} onClick={(e) => {
        e.stopPropagation();  // 阻止事件冒泡，防止触发父组件的 onClick
        onClose(); // 点击蒙层时关闭弹窗
      }}>
    
    {/* 内层弹窗容器 */}
    <div style={{
      background: '#fff',
      padding: '24px 20px',
      borderRadius: 16,
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      width: '90%',
      boxSizing: 'border-box',
      maxWidth: 600,
    }} onClick={(e) => e.stopPropagation()}>

      {/* 顶部标题 + 保存按钮 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <h3 style={{
          fontSize: 16,
          color: '#333',
          margin: 0,
        }}>新增预算条目</h3>

        <button
          onClick={handleSubmit}
          style={{
            color: '#00B158',
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          title="保存"
        >
          <FaCheck />
        </button>
      </div>

      {/* 输入描述 */}
      <input
        placeholder="描述"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          marginBottom: 12,
          borderRadius: 8,
          border: '1px solid #ddd',
          fontSize: 16,
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />

      {/* 输入金额 */}
      <input
        placeholder="金额"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          marginBottom: 8,
          borderRadius: 8,
          border: '1px solid #ddd',
          fontSize: 16,
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
    </div>
  </div>
);

}


export default AddItemModal;