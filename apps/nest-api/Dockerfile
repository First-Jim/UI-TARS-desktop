# 使用官方 Node.js 20 Alpine 镜像作为基础镜像
FROM node:20-alpine

# 配置国内镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    npm config set registry https://registry.npmmirror.com && \
    apk update && \
    apk add --no-cache curl && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制 Prisma schema
COPY prisma ./prisma/

# 生成 Prisma 客户端
RUN npx prisma generate

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 启动应用 - 先加载环境变量，再运行 Prisma 迁移和启动应用
CMD ["sh", "-c", "set -a && . ./.env.production && set +a && npx prisma migrate deploy && node dist/src/main"]
