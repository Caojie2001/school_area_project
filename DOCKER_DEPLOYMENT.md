# 高校建筑面积缺口计算器 - Docker 容器化部署指南

## 🐳 Docker Compose 部署说明

本文档详细说明如何使用 Docker Compose 部署高校建筑面积缺口计算器系统。

---

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [部署步骤](#部署步骤)
- [服务管理](#服务管理)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)
- [安全配置](#安全配置)

---

## 🔧 系统要求

### 硬件要求
- **CPU**: 2核心以上
- **内存**: 4GB 以上（应用512MB + MySQL 1GB + 系统预留）
- **磁盘**: 10GB 可用空间

### 软件要求
- **Docker**: 版本 20.10 或更高
- **Docker Compose**: 版本 2.0 或更高
- **操作系统**: Linux、macOS 或 Windows

### 安装 Docker（如需要）

#### macOS
```bash
# 使用 Homebrew 安装
brew install --cask docker

# 或下载 Docker Desktop for Mac
# https://docs.docker.com/desktop/mac/install/
```

#### Linux (Ubuntu/Debian)
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 验证安装
```bash
docker --version
docker-compose --version
```

---

## 🚀 快速开始

### 1. 检查配置文件
确保以下文件存在并正确配置：

```bash
# 检查必要文件
ls -la .env
ls -la docker-compose.security.yml
ls -la Dockerfile
ls -la certs/
```

### 2. 一键启动
```bash
# 构建并启动所有服务
docker-compose -f docker-compose.security.yml up -d --build
```

### 3. 验证部署
```bash
# 检查服务状态
docker-compose -f docker-compose.security.yml ps

# 查看日志
docker-compose -f docker-compose.security.yml logs -f
```

### 4. 访问系统
- **HTTPS 访问**: https://localhost:3443
- **HTTP 访问**: http://localhost:3000 (自动重定向到 HTTPS)

---

## ⚙️ 配置说明

### 环境变量配置 (.env)

系统使用 `.env` 文件进行配置，主要变量说明：

```bash
# 服务器端口配置
PORT=3000                    # HTTP 端口
HTTPS_PORT=3443             # HTTPS 端口

# 安全配置
NODE_ENV=development        # 环境模式（Docker中自动覆盖为production）
FORCE_HTTPS=false          # 是否强制HTTPS

# MySQL数据库配置
DB_HOST=localhost          # 数据库主机（原生部署用localhost，Docker部署时可设置为db）
DB_PORT=3306              # 数据库端口
DB_USER=root              # 数据库用户名
DB_PASSWORD=your_password # 数据库密码
DB_NAME=school_area_management # 数据库名称

# Docker部署专用配置
DB_ROOT_PASSWORD=your_password # MySQL root用户密码

# 文件存储配置
OUTPUT_DIR=output         # 输出文件目录
KEEP_FILES_COUNT=5        # 保留的历史文件数量
```

### Docker Compose 服务架构

#### 应用服务 (app)
- **镜像**: 本地构建
- **端口**: 3000 (HTTP), 3443 (HTTPS)
- **资源限制**: 512MB 内存，0.5 CPU
- **安全**: 非root用户运行，只读文件系统

#### 数据库服务 (db)
- **镜像**: mysql:8.0
- **端口**: 3306 (仅内部访问)
- **资源限制**: 1GB 内存，1.0 CPU
- **数据持久化**: 独立数据卷

---

## 📦 部署步骤

### 步骤1: 准备环境

```bash
# 1. 克隆或进入项目目录
cd /path/to/school_area_project

# 2. 检查配置文件
cat .env

# 3. 确认SSL证书存在
ls -la certs/
```

### 步骤2: 构建镜像

```bash
# 构建应用镜像
docker-compose -f docker-compose.security.yml build

# 查看构建的镜像
docker images | grep school
```

### 步骤3: 启动服务

```bash
# 启动所有服务（后台运行）
docker-compose -f docker-compose.security.yml up -d

# 或者前台运行（查看实时日志）
docker-compose -f docker-compose.security.yml up
```

### 步骤4: 验证部署

```bash
# 检查容器状态
docker-compose -f docker-compose.security.yml ps

# 预期输出示例：
#     Name                   Command               State           Ports         
# ---------------------------------------------------------------------------
# school_area_app   docker-entrypoint.sh npm ...   Up      0.0.0.0:3000->3000/tcp, 0.0.0.0:3443->3443/tcp
# school_area_db    docker-entrypoint.sh mysqld    Up      3306/tcp, 33060/tcp
```

### 步骤5: 健康检查

```bash
# 检查应用健康状态
curl -k https://localhost:3443/api/auth/status

# 检查数据库连接
docker-compose -f docker-compose.security.yml exec db mysqladmin ping -h localhost -u root -p
```

---

## 🔄 服务管理

### 启动服务
```bash
# 启动所有服务
docker-compose -f docker-compose.security.yml up -d

# 启动指定服务
docker-compose -f docker-compose.security.yml up -d app
docker-compose -f docker-compose.security.yml up -d db
```

### 停止服务
```bash
# 停止所有服务
docker-compose -f docker-compose.security.yml down

# 停止服务但保留数据卷
docker-compose -f docker-compose.security.yml stop

# 停止指定服务
docker-compose -f docker-compose.security.yml stop app
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.security.yml restart

# 重启指定服务
docker-compose -f docker-compose.security.yml restart app
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose -f docker-compose.security.yml logs -f

# 查看指定服务日志
docker-compose -f docker-compose.security.yml logs -f app
docker-compose -f docker-compose.security.yml logs -f db

# 查看最近100行日志
docker-compose -f docker-compose.security.yml logs --tail=100 app
```

### 更新应用
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建并启动
docker-compose -f docker-compose.security.yml up -d --build

# 3. 清理旧镜像（可选）
docker image prune -f
```

---

## 📊 监控和维护

### 资源监控
```bash
# 查看容器资源使用情况
docker stats

# 查看容器详细信息
docker-compose -f docker-compose.security.yml top
```

### 数据备份
```bash
# 备份数据库
docker-compose -f docker-compose.security.yml exec db mysqldump -u root -p school_area_management > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份应用数据
docker-compose -f docker-compose.security.yml exec app tar -czf /tmp/app_data_$(date +%Y%m%d_%H%M%S).tar.gz /app/output
```

### 数据恢复
```bash
# 恢复数据库
docker-compose -f docker-compose.security.yml exec -T db mysql -u root -p school_area_management < backup_file.sql
```

### 清理和维护
```bash
# 清理停止的容器
docker container prune -f

# 清理未使用的镜像
docker image prune -f

# 清理未使用的数据卷
docker volume prune -f

# 查看磁盘使用情况
docker system df
```

---

## 🚨 故障排除

### 常见问题和解决方案

#### 1. 服务启动失败
```bash
# 检查日志
docker-compose -f docker-compose.security.yml logs app

# 常见原因：
# - 端口被占用
# - 环境变量配置错误
# - SSL证书缺失
```

#### 2. 数据库连接失败
```bash
# 检查数据库状态
docker-compose -f docker-compose.security.yml exec db mysqladmin ping -h localhost -u root -p

# 检查网络连接
docker-compose -f docker-compose.security.yml exec app ping db
```

#### 3. 端口冲突
```bash
# 检查端口占用
lsof -i :3000
lsof -i :3443

# 修改端口映射（在docker-compose.yml中）
ports:
  - "3001:3000"   # 修改主机端口
  - "3444:3443"   # 修改主机端口
```

#### 4. SSL证书问题
```bash
# 检查证书文件
ls -la certs/

# 重新生成证书（如果需要）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/private-key.pem \
  -out certs/certificate.pem \
  -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"
```

#### 5. 权限问题
```bash
# 检查文件权限
ls -la certs/
ls -la output/

# 修复权限
sudo chown -R 1001:1001 certs/ output/
```

### 调试模式
```bash
# 以调试模式启动（显示详细输出）
docker-compose -f docker-compose.security.yml up --build

# 进入容器调试
docker-compose -f docker-compose.security.yml exec app sh
docker-compose -f docker-compose.security.yml exec db bash
```

---

## 🔐 安全配置

### 生产环境安全检查清单

#### ✅ 网络安全
- [x] 仅暴露必要端口 (3000, 3443)
- [x] 数据库仅内部网络访问
- [x] 使用自定义网络隔离

#### ✅ 容器安全
- [x] 非root用户运行
- [x] 只读文件系统
- [x] 禁用权限提升
- [x] 资源限制配置

#### ✅ 数据安全
- [x] SSL/TLS 加密
- [x] 敏感文件不打包进镜像
- [x] 数据持久化配置
- [x] 定期备份策略

#### ✅ 访问控制
- [x] 强密码策略
- [x] 会话管理
- [x] 输入验证

### 安全最佳实践

1. **定期更新**
   ```bash
   # 更新基础镜像
   docker-compose -f docker-compose.security.yml pull
   docker-compose -f docker-compose.security.yml up -d
   ```

2. **监控日志**
   ```bash
   # 设置日志轮转
   docker-compose -f docker-compose.security.yml config
   ```

3. **网络隔离**
   - 使用防火墙限制访问
   - 考虑使用反向代理 (Nginx/Traefik)

---

## 📈 性能优化

### 资源调优
```yaml
# 根据实际需求调整资源限制
deploy:
  resources:
    limits:
      memory: 1G      # 增加内存限制
      cpus: '1.0'     # 增加CPU限制
```

### 数据库优化
```bash
# 数据库性能调优参数
environment:
  - MYSQL_INNODB_BUFFER_POOL_SIZE=256M
  - MYSQL_MAX_CONNECTIONS=100
```

---

## 📞 支持和帮助

### 获取帮助
- 查看应用日志定位问题
- 检查系统资源使用情况
- 验证网络连接和防火墙设置

### 文档参考
- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [MySQL Docker 镜像文档](https://hub.docker.com/_/mysql)

---

## 📝 更新日志

### v1.0.0 (2025-08-27)
- 初始 Docker 化配置
- 安全加固配置
- HTTPS/SSL 支持
- 数据持久化
- 健康检查
- 资源限制

---

*本文档最后更新：2025年8月27日*
