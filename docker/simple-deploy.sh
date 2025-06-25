#!/bin/bash

# 简化部署脚本 - 使用 docker compose 而不是 docker-compose

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
SERVER_IP="113.44.3.38"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/huawei_cloud_key"
PROJECT_NAME="my-fullstack-starter"

# 检查本地环境
check_local_env() {
    log_info "检查本地环境..."
    
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH 密钥不存在: $SSH_KEY"
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        log_error "rsync 未安装"
        exit 1
    fi
    
    log_info "本地环境检查完成"
}

# 直接同步文件到服务器
sync_to_server() {
    log_info "同步文件到服务器..."
    
    # 使用 rsync 直接同步到服务器
    rsync -avz --delete \
        -e "ssh -i $SSH_KEY" \
        --exclude='node_modules' \
        --exclude='*/node_modules' \
        --exclude='*/dist' \
        --exclude='*/.next' \
        --exclude='.git' \
        --exclude='*/logs' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --exclude='*/coverage' \
        --exclude='*/.nyc_output' \
        --exclude='old-configs-backup-*' \
        --exclude='*.tar.gz' \
        --exclude='ssl/*.pem' \
        --exclude='ssl/*.key' \
        . "${SERVER_USER}@${SERVER_IP}:/opt/develop/${PROJECT_NAME}/"
    
    log_info "文件同步完成"
}

# 在服务器上部署
deploy_on_server() {
    log_info "在服务器上部署应用..."
    
    ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" << 'EOF'
        set -e
        
        cd /opt/develop/my-fullstack-starter
        
        echo "[INFO] 停止现有服务..."
        docker compose down 2>/dev/null || docker-compose down 2>/dev/null || echo "没有运行的服务"
        
        echo "[INFO] 清理旧镜像..."
        docker system prune -f || true
        
        echo "[INFO] 创建必要的目录..."
        mkdir -p ssl logs
        
        echo "[INFO] 检查配置文件..."
        
        if [ ! -f "docker-compose.yml" ]; then
            echo "[ERROR] docker-compose.yml 文件不存在"
            exit 1
        fi
        
        echo "[INFO] 启动服务..."
        if command -v docker-compose &> /dev/null; then
            docker-compose --env-file .env.production up -d --build
        else
            docker compose --env-file .env.production up -d --build
        fi
        
        echo "[INFO] 等待服务启动..."
        sleep 10
        
        echo "[INFO] 检查服务状态..."
        if command -v docker-compose &> /dev/null; then
            docker-compose ps
        else
            docker compose ps
        fi
        
        echo "[INFO] 部署完成！"
EOF
    
    log_info "服务器部署完成"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" << 'EOF'
        cd /opt/develop/my-fullstack-starter
        
        echo "=== Docker 容器状态 ==="
        if command -v docker-compose &> /dev/null; then
            docker-compose ps
        else
            docker compose ps
        fi
        
        echo -e "\n=== 服务日志 (最近10行) ==="
        if command -v docker-compose &> /dev/null; then
            docker-compose logs --tail=10
        else
            docker compose logs --tail=10
        fi
        
        echo -e "\n=== 网络连接测试 ==="
        curl -f http://localhost/health 2>/dev/null && echo "前端服务正常" || echo "前端服务异常"
        curl -f http://localhost/api/health 2>/dev/null && echo "后端服务正常" || echo "后端服务异常"
EOF
}

# 主函数
main() {
    log_info "开始简化部署 $PROJECT_NAME 到华为云服务器..."
    
    # 检查参数
    if [ "$1" = "--check-only" ]; then
        check_services
        exit 0
    fi
    
    # 执行部署步骤
    check_local_env
    sync_to_server
    deploy_on_server
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 20
    
    # 检查服务状态
    check_services
    
    log_info "部署完成！"
    log_info "访问地址: http://${SERVER_IP}"
    log_warn "如需 HTTPS，请先配置 SSL 证书"
}

# 显示帮助信息
show_help() {
    echo "简化部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --check-only    仅检查服务状态，不执行部署"
    echo "  --help         显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0              执行完整部署"
    echo "  $0 --check-only 检查服务状态"
}

# 处理命令行参数
case "$1" in
    --help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
