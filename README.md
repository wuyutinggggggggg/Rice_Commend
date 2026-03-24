# 稻米个性化推荐系统

基于AI的现代化稻米推荐平台，使用React + TypeScript前端，Express + MySQL后端，集成Google Gemini AI进行智能推荐。

## 本地运行

**前提条件：** Node.js, MySQL

### 1. 安装依赖
```bash
npm install
```

### 2. 设置MySQL数据库
- 安装并启动MySQL服务器
- 创建数据库：`rice`
- 更新 `.env` 文件中的数据库配置：
  ```
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=your_mysql_password
  DB_NAME=rice_db
  PORT=3001
  ```

### 3. 设置AI API密钥
在 `.env` 文件中设置API密钥：
```
GEMINI_API_KEY=your_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

**AI服务说明：**
- 系统优先使用Google Gemini API
- 当Gemini不可用时，自动切换到DeepSeek API
- DeepSeek不支持图像分析，图像功能依赖Gemini

### 4. 运行应用
- 启动后端服务器：
  ```bash
  npm run server
  ```
- 启动前端开发服务器：
  ```bash
  npm run dev
  ```
- 或同时运行前后端：
  ```bash
  npm run dev:full
  ```

应用将在 http://localhost:5173 运行，后端API在 http://localhost:3001。

## 技术栈
- **前端：** React 19, TypeScript, Vite, Tailwind CSS
- **后端：** Node.js, Express, MySQL
- **AI：** Google Gemini API
- **UI组件：** Lucide React, Recharts

## 功能特性
- 智能稻米推荐（文本偏好、图像分析、每日优选）
- 用户管理和收藏系统
- 管理员后台管理
- 响应式设计，支持移动端
