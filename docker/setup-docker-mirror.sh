#!/bin/bash

# 配置 Docker 镜像加速器

set -e

# 配置变量
SERVER_IP="113.44.3.38"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/huawei_cloud_key"

echo "[INFO] 配置 Docker 镜像加速器..."

ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" << 'EOF'
    set -e
    
    echo "[INFO] 创建 Docker 配置目录..."
    mkdir -p /etc/docker
    
    echo "[INFO] 配置 Docker 镜像加速器..."
    cat > /etc/docker/daemon.json << 'DOCKER_CONFIG'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://mirror.baidubce.com",
    "https://reg-mirror.qiniu.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
DOCKER_CONFIG
    
    echo "[INFO] 重启 Docker 服务..."
    systemctl daemon-reload
    systemctl restart docker
    
    echo "[INFO] 验证 Docker 配置..."
    docker info | grep -A 10 "Registry Mirrors" || echo "镜像配置完成"
    
    echo "[INFO] 测试拉取镜像..."
    docker pull nginx:alpine
    
    echo "[INFO] Docker 镜像加速器配置完成！"
EOF

echo "[INFO] Docker 镜像加速器配置完成！"
