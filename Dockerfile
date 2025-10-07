# 使用 Node.js 22 Alpine 映像（輕量化）
FROM node:22-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝所有依賴（包含 devDependencies for build）
# 強制安裝 devDependencies（即使在 production 環境）
RUN npm ci --include=dev

# 複製所有原始碼
COPY . .

# 🔑 宣告 Build Arguments（從 Zeabur 環境變數傳入）
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET

# 🔑 設定為環境變數供 Vite 使用
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME
ENV VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET

# Build 前端（現在可以讀取環境變數）
RUN npm run build

# 暴露 port 4000
EXPOSE 4000

# 設定環境變數為生產模式
ENV NODE_ENV=production

# 啟動 Express 伺服器
CMD ["npm", "start"]
