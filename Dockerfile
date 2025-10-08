# 使用 Node.js 22 Alpine 映像（輕量化）
FROM node:22-alpine

# 設定工作目錄
WORKDIR /app

# 🔑 接收 Git Commit SHA（用於破壞 Docker cache）
ARG COMMIT_SHA=unknown
RUN echo "Building from commit: $COMMIT_SHA"

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝所有依賴（強制安裝 devDependencies，即使 NODE_ENV=production）
RUN npm install --production=false

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
