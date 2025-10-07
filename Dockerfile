# 使用 Node.js 22 Alpine 映像（輕量化）
FROM node:22-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製所有原始碼
COPY . .

# Build 前端（產生 dist/）
RUN npm run build

# 暴露 port 4000
EXPOSE 4000

# 設定環境變數為生產模式
ENV NODE_ENV=production

# 啟動 Express 伺服器
CMD ["npm", "start"]
