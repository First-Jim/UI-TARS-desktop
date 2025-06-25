#!/bin/bash

# SSL 证书配置脚本
# 支持 Let's Encrypt 免费证书和自签名证书

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
DOMAIN="113.44.3.38"  # 可以替换为您的域名
EMAIL="admin@example.com"  # 替换为您的邮箱
SSL_DIR="/opt/develop/my-fullstack-starter/ssl"

# 创建自签名证书
create_self_signed_cert() {
    log_info "创建自签名 SSL 证书..."
    
    mkdir -p "$SSL_DIR"
    cd "$SSL_DIR"
    
    # 生成私钥
    openssl genrsa -out privkey.pem 2048
    
    # 生成证书签名请求
    openssl req -new -key privkey.pem -out cert.csr -subj "/C=CN/ST=Beijing/L=Beijing/O=MyCompany/OU=IT/CN=$DOMAIN"
    
    # 生成自签名证书
    openssl x509 -req -in cert.csr -signkey privkey.pem -out fullchain.pem -days 365
    
    # 设置权限
    chmod 600 privkey.pem
    chmod 644 fullchain.pem
    
    # 清理临时文件
    rm cert.csr
    
    log_info "自签名证书创建完成"
    log_warn "自签名证书仅用于测试，浏览器会显示安全警告"
}

# 使用 Let's Encrypt 获取证书
create_letsencrypt_cert() {
    log_info "使用 Let's Encrypt 获取 SSL 证书..."
    
    # 检查是否安装了 certbot
    if ! command -v certbot &> /dev/null; then
        log_error "Certbot 未安装，请先运行 server-setup.sh"
        exit 1
    fi
    
    # 检查域名是否为 IP 地址
    if [[ $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        log_error "Let's Encrypt 不支持 IP 地址，请使用域名或选择自签名证书"
        exit 1
    fi
    
    # 停止 nginx 以释放 80 端口
    docker-compose -f /opt/develop/my-fullstack-starter/docker-compose.yml stop nginx 2>/dev/null || true
    
    # 获取证书
    certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"
    
    # 复制证书到项目目录
    mkdir -p "$SSL_DIR"
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
    
    # 设置权限
    chmod 644 "$SSL_DIR/fullchain.pem"
    chmod 600 "$SSL_DIR/privkey.pem"
    
    log_info "Let's Encrypt 证书获取完成"
}

# 创建证书续期脚本
create_renewal_script() {
    log_info "创建证书自动续期脚本..."
    
    cat > /opt/develop/ssl-renewal.sh << 'EOF'
#!/bin/bash

# SSL 证书自动续期脚本

DOMAIN="113.44.3.38"  # 替换为您的域名
SSL_DIR="/opt/develop/my-fullstack-starter/ssl"
COMPOSE_FILE="/opt/develop/my-fullstack-starter/docker-compose.yml"

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"
}

# 检查证书是否需要续期
check_cert_expiry() {
    if [ ! -f "$SSL_DIR/fullchain.pem" ]; then
        log_error "证书文件不存在: $SSL_DIR/fullchain.pem"
        return 1
    fi
    
    # 检查证书过期时间
    expiry_date=$(openssl x509 -enddate -noout -in "$SSL_DIR/fullchain.pem" | cut -d= -f2)
    expiry_timestamp=$(date -d "$expiry_date" +%s)
    current_timestamp=$(date +%s)
    days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    log_info "证书将在 $days_until_expiry 天后过期"
    
    # 如果证书在 30 天内过期，则续期
    if [ $days_until_expiry -lt 30 ]; then
        return 0  # 需要续期
    else
        return 1  # 不需要续期
    fi
}

# 续期证书
renew_certificate() {
    log_info "开始续期 SSL 证书..."
    
    # 停止 nginx
    docker-compose -f "$COMPOSE_FILE" stop nginx
    
    # 续期证书
    if certbot renew --standalone; then
        log_info "证书续期成功"
        
        # 复制新证书
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
        
        # 重启服务
        docker-compose -f "$COMPOSE_FILE" up -d nginx
        
        log_info "服务重启完成"
    else
        log_error "证书续期失败"
        
        # 重启 nginx
        docker-compose -f "$COMPOSE_FILE" up -d nginx
        
        exit 1
    fi
}

# 主逻辑
if check_cert_expiry; then
    renew_certificate
else
    log_info "证书无需续期"
fi
EOF
    
    chmod +x /opt/develop/ssl-renewal.sh
    
    # 添加到 crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/develop/ssl-renewal.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -
    
    log_info "证书续期脚本创建完成: /opt/develop/ssl-renewal.sh"
    log_info "已添加到 crontab，每天凌晨 2 点检查证书状态"
}

# 验证证书
verify_certificate() {
    log_info "验证 SSL 证书..."
    
    if [ ! -f "$SSL_DIR/fullchain.pem" ] || [ ! -f "$SSL_DIR/privkey.pem" ]; then
        log_error "证书文件不存在"
        return 1
    fi
    
    # 检查证书有效性
    if openssl x509 -in "$SSL_DIR/fullchain.pem" -text -noout > /dev/null 2>&1; then
        log_info "证书格式正确"
    else
        log_error "证书格式错误"
        return 1
    fi
    
    # 检查私钥
    if openssl rsa -in "$SSL_DIR/privkey.pem" -check > /dev/null 2>&1; then
        log_info "私钥格式正确"
    else
        log_error "私钥格式错误"
        return 1
    fi
    
    # 显示证书信息
    echo "=== 证书信息 ==="
    openssl x509 -in "$SSL_DIR/fullchain.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"
    
    log_info "证书验证完成"
}

# 显示帮助信息
show_help() {
    echo "SSL 证书配置脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --self-signed    创建自签名证书 (用于测试)"
    echo "  --letsencrypt    使用 Let's Encrypt 获取免费证书"
    echo "  --verify         验证现有证书"
    echo "  --renew          手动续期证书"
    echo "  --help           显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --self-signed     # 创建自签名证书"
    echo "  $0 --letsencrypt     # 获取 Let's Encrypt 证书"
    echo "  $0 --verify          # 验证证书"
}

# 主函数
main() {
    case "$1" in
        --self-signed)
            create_self_signed_cert
            create_renewal_script
            verify_certificate
            ;;
        --letsencrypt)
            create_letsencrypt_cert
            create_renewal_script
            verify_certificate
            ;;
        --verify)
            verify_certificate
            ;;
        --renew)
            /opt/develop/ssl-renewal.sh
            ;;
        --help|*)
            show_help
            exit 0
            ;;
    esac
}

main "$@"
