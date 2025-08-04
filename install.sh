#!/bin/bash

echo "🚀 高校建筑面积缺口测算系统 - 安装脚本"
echo "======================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

echo "✅ Node.js版本: v$NODE_VERSION"

# 版本比较 (简单版本)
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ 错误: Node.js版本过低，需要 >= v$REQUIRED_VERSION"
    echo "请升级Node.js版本"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm"
    echo "请确保npm已正确安装"
    exit 1
fi

echo "✅ npm版本: $(npm --version)"

# 安装依赖
echo ""
echo "📦 正在安装项目依赖..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功!"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

# 创建必要的文件夹
echo ""
echo "📁 创建必要的文件夹..."
mkdir -p uploads
mkdir -p output
echo "✅ 文件夹创建完成"

# 创建Excel模板文件
echo ""
echo "📄 准备Excel模板文件..."
if [ -f "templates/create-templates.js" ]; then
    node templates/create-templates.js
    echo "✅ Excel模板文件准备完成"
else
    echo "⚠️  模板生成脚本不存在，跳过模板创建"
fi

# 复制环境配置文件
echo ""
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ 已创建环境配置文件 (.env)"
    echo "💡 提示: 如需使用数据库功能，请编辑 .env 文件配置数据库连接信息"
else
    echo "✅ 环境配置文件已存在"
fi

echo ""
echo "🎉 高校建筑面积缺口测算系统安装完成!"
echo ""
echo "🚀 启动应用命令:"
echo "   npm start      # 生产环境启动"
echo "   npm run dev    # 开发环境启动 (需要安装nodemon)"
echo ""
echo "🌐 访问地址: http://localhost:3000"
echo ""
echo "� 功能说明:"
echo "   • 数据填报: 在线填写学校建筑面积信息"
echo "   • 数据管理: 查看和管理历史记录"
echo "   • 统计分析: 生成统计报告和分析"
echo ""
echo "📚 详细使用说明请查看 README.md"
echo "🗂️  数据库配置说明请查看 阿里云RDS配置指南.md"
