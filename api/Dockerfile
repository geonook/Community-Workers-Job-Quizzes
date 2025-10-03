FROM node:22-slim
LABEL "language"="nodejs"
LABEL "framework"="express"

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
