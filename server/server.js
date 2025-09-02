//这段代码是一个使用 Node.js + Express 搭建的简单 后端服务程序
//引入 Express 框架。Express 是 Node.js 最常用的 Web 服务框架，用来创建接口、处理请求
const express = require('express');
//引入 Node.js 的 文件系统模块，用来读取和写入文件（比如读取 data.json）。
const fs = require('fs');
//引入 Node.js 的 路径模块，可以帮我们拼接正确的文件路径（避免手动写错路径格式）
const path = require('path');
//*****创建一个后端应用
const app = express();

//Vercel/Railway 等平台：平台会自动设置 process.env.PORT，这行代码就能自动适配
const PORT = process.env.PORT || 3001;


// 允许跨域请求（前后端分开开发必须）
const cors = require('cors');
app.use(cors());

// 解析 JSON body（后面用 POST/PUT 会用到）
app.use(express.json());

// 一、读取数据
app.get('/data', (req, res) => {
  const filePath = path.join(__dirname, 'data.json');
  //data.json 就是厨房存货（预算数据）
  //fs.readFile 就是后厨翻开本地记账本
  //res.json(...) 是端上这份数据给客户（前端）
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Error reading data.json:', err);
      return res.status(500).json({ error: '无法读取数据文件' });
    }//如果成功读取了 JSON 文件，就把字符串转为 JS 对象，并返回给前端。
    res.json(JSON.parse(data));
  });
});

// 二、保存数据
//定义一个 POST 类型的路由 /save
//pose和get类型分别是什么
//req 是请求对象，res 是响应对象
app.post('/save', (req, res) => {
  //通过 req.body 获取前端传来的数据
  const newData = req.body;
  //使用 path.join 构造出 data.json 文件的完整路径
  //__dirname：当前这个 server.js 文件所在的目录
  const filePath = path.join(__dirname, 'data.json');

  fs.writeFile(filePath, JSON.stringify(newData, null, 2), (err) => {
    if (err) {
      console.error('❌ 写入失败:', err);
      res.status(500).send({ message: '保存失败' });
    } else {
      console.log('✅ 数据已保存至 data.json');
      res.send({ message: '保存成功' });
    }
  });
});

// 启动服务
//*******监听3001端口
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
