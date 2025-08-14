# 高校建筑面积缺口测算系统

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-orange.svg)](package.json)

一个现代化的Web应用程序，用于高校建筑面积缺口分析与计算。支持在线数据录入、自动标准化计算、智能缺口分析和专业报告生成。

## ✨ 核心功能

### 🏫 学校信息管理
- **多类型学校支持** - 综合类、理工类、农业类等多种院校类型
- **学生数据统计** - 全日制学生、留学生分类管理
- **建筑面积录入** - 现有建筑面积详细记录
- **统计年份管理** - 支持学生统计年份和建筑统计年份独立设置

### 📊 智能测算分析
- **标准化计算** - 基于教育部标准的自动化面积计算
- **五类建筑分析** - 教学、办公、宿舍、生活、后勤用房全覆盖
- **缺口分析** - 精确计算各类建筑面积缺口
- **达标评估** - 自动判断各类用房达标情况
- **特殊补助** - 支持特殊用房补助项目动态添加

### 🔐 用户权限管理
- **多角色系统** - 管理员、基建中心、学校用户三级权限
- **安全认证** - 基于Session的用户认证机制
- **数据隔离** - 不同角色用户数据访问权限控制
- **用户管理** - 完整的用户增删改查功能

### 📈 统计分析功能
- **多维度筛选** - 按年份、用户类型灵活筛选数据
- **汇总统计** - 自动计算总面积、缺口等关键指标
- **趋势分析** - 支持历史数据对比分析
- **数据导出** - 生成Excel格式的专业分析报告

### 📋 数据管理
- **历史记录** - 完整的数据修改历史追踪
- **批量操作** - 支持数据批量导入导出
- **数据验证** - 完善的数据完整性检查
- **备份恢复** - 支持数据备份和恢复功能

## 🛠️ 技术架构

### 后端技术栈
```
├── Node.js 16+          # 服务器运行环境
├── Express.js 4.18+     # Web应用框架
├── MySQL 8.0+           # 关系型数据库
├── mysql2 3.14+         # MySQL连接驱动
├── bcrypt 6.0+          # 密码加密
├── express-session      # 会话管理
├── xlsx 0.18+           # Excel文件处理
└── cors 2.8+            # 跨域资源共享
```

### 前端技术栈
```
├── HTML5               # 语义化页面结构
├── CSS3                # 现代化样式设计
│   ├── 模块化架构       # 按功能拆分的CSS文件结构
│   ├── Flexbox布局     # 现代弹性布局系统
│   ├── Grid布局        # 二维网格布局系统
│   ├── 响应式设计       # 多设备屏幕适配
│   └── CSS变量         # 主题色彩统一管理
├── JavaScript ES6+     # 原生JS交互逻辑
├── Fetch API           # 异步数据通信
└── 现代化UI设计        # 卡片式界面、渐变效果、动画交互
```

### 数据库设计
```
├── school_info         # 学校信息与测算结果主表
├── special_subsidies   # 特殊补助信息表
├── users              # 用户信息与权限表
└── 索引优化            # 查询性能优化
```

### CSS架构设计
```
├── 模块化分离          # 按功能模块分离CSS文件
├── 组件化设计          # 可复用的UI组件样式
├── 响应式布局          # 移动端优先的响应式设计
├── 主题统一            # 统一的色彩和字体规范
└── 性能优化            # CSS文件压缩和加载优化
```

**CSS模块说明:**
- **base.css**: 重置样式、基础字体、主题色彩变量
- **layout.css**: 页面布局、侧边栏、导航结构
- **components.css**: 按钮、卡片、弹窗、提示组件
- **forms.css**: 表单控件、输入验证、年份选择器
- **student-fields.css**: 学生信息表单专用样式
- **tables.css**: 数据表格、冻结列、排序样式
- **results.css**: 分析结果展示、图表、下载组件
- **responsive.css**: 移动端适配、平板端优化

## 📁 项目结构

```
school_area_project/
├── 🚀 核心服务文件
│   ├── server.js                    # Express服务器主文件
│   ├── database.js                  # MySQL数据库连接配置
│   ├── dataService.js               # 数据访问层服务
│   └── authService.js               # 用户认证服务
│
├── ⚙️ 配置文件
│   ├── package.json                 # 项目依赖和脚本配置
│   ├── package-lock.json            # 依赖版本锁定文件
│   ├── .env.example                 # 环境变量配置模板
│   ├── .env                         # 环境变量配置文件（需创建）
│   └── .gitignore                   # Git版本控制忽略规则
│
├── 🌐 前端界面
│   └── public/
│       ├── 📄 HTML页面
│       │   ├── index.html               # 主应用界面
│       │   ├── login.html               # 用户登录页面
│       │   └── user-management.html     # 用户管理页面
│       │
│       ├── 🎨 样式文件 (模块化CSS架构)
│       │   ├── style.css                # 整合后的完整样式文件
│       │   └── css/                     # 模块化CSS文件目录
│       │       ├── main.css             # 主样式文件（导入所有模块）
│       │       ├── base.css             # 基础样式（重置、字体、颜色）
│       │       ├── layout.css           # 布局样式（侧边栏、页面结构）
│       │       ├── components.css       # 组件样式（按钮、卡片、提示）
│       │       ├── forms.css            # 表单样式（输入框、选择器）
│       │       ├── student-fields.css   # 学生字段专用样式
│       │       ├── tables.css           # 表格样式（数据表格、冻结列）
│       │       ├── results.css          # 结果显示样式（分析图表）
│       │       └── responsive.css       # 响应式样式（移动端适配）
│       │
│       ├── 📱 交互脚本
│       │   └── script.js                # 前端交互脚本
│       │
│       └── 🖼️ 静态资源
│           └── login_background.jpg     # 登录背景图片
│
├── 📊 数据文件
│   └── data/
│       ├── 院校类别.xlsx            # 院校分类标准数据
│       ├── 示例-测算结果.xlsx       # 测算结果示例
│       └── 示例_测算汇总.xlsx       # 汇总数据示例
│
├── 📈 输出文件
│   └── output/                      # Excel报告输出目录
│
├── 🔧 工具脚本
│   └── install.sh                   # 自动安装配置脚本
│
└── 📝 文档
    └── README.md                    # 项目说明文档
```

## 🚀 快速开始

### 环境要求
- **Node.js**: 16.0 或更高版本
- **npm**: 8.0 或更高版本  
- **MySQL**: 8.0 或更高版本
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### 安装步骤

#### 方式一：自动安装（推荐）
```bash
# 1. 克隆或下载项目
git clone <repository-url>
cd school_area_project

# 2. 运行自动安装脚本
chmod +x install.sh
./install.sh
```

#### 方式二：手动安装
```bash
# 1. 安装项目依赖
npm install

# 2. 复制环境配置文件
cp .env.example .env

# 3. 编辑数据库配置
nano .env
```

### 数据库配置

1. **创建数据库**
```sql
CREATE DATABASE school_area_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **配置环境变量** (`.env`)
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=school_area_management

# 会话配置
SESSION_SECRET=your_secret_key_here

# 服务器配置
PORT=3000
NODE_ENV=production
```

### 启动应用

```bash
# 生产环境启动
npm start

# 开发环境启动（需要安装nodemon）
npm run dev
```

访问应用: http://localhost:3000

## 📖 使用指南

### 数据录入流程
1. **登录系统** - 使用学校用户账号登录
2. **选择学校类型** - 根据实际情况选择院校类型
3. **录入学生数据** - 分类录入全日制和留学生人数
4. **录入建筑面积** - 填写现有建筑面积数据
5. **添加特殊补助** - 根据需要添加特殊用房补助
6. **自动计算** - 系统自动计算缺口并生成分析结果
7. **生成报告** - 导出Excel格式的详细分析报告

### 数据管理功能
- **数据查询** - 支持多条件组合查询
- **数据编辑** - 在线编辑已保存的数据
- **数据删除** - 安全删除不需要的记录
- **批量操作** - 批量导入导出数据

### 统计分析功能
- **年份筛选** - 按测算年份查看数据
- **用户筛选** - 按用户类型分析数据
- **汇总统计** - 查看总体统计指标
- **趋势分析** - 多年数据对比分析

## 🔧 系统配置

### 计算标准配置
系统采用以下国家标准进行计算：
- **教学及辅助用房**: 根据学科类型和学生规模
- **办公用房**: 按学生总数比例计算
- **学生宿舍**: 按在校学生数量计算
- **其他生活用房**: 根据学生总数配置
- **后勤辅助用房**: 按学校规模配置

### 权限配置说明
- **管理员**: 完全权限，包括用户管理和系统配置
- **基建中心**: 数据审核和统计分析权限
- **学校用户**: 数据录入和查看权限

## 🐛 故障排除

### 常见问题

**1. 数据库连接失败**
```bash
# 检查MySQL服务状态
sudo systemctl status mysql

# 检查环境变量配置
cat .env
```

**2. 端口被占用**
```bash
# 查找占用端口的进程
lsof -i :3000

# 终止进程
kill -9 <PID>
```

**3. 依赖安装失败**
```bash
# 清除npm缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

## 📊 性能优化

### 数据库优化
- 使用索引优化查询性能
- 定期清理过期数据
- 配置适当的连接池大小

### 前端性能优化
- **CSS模块化**: 按需加载CSS文件，减少首屏加载时间
- **样式压缩**: 生产环境下压缩CSS文件大小
- **缓存策略**: 配置适当的CSS文件缓存策略
- **响应式优化**: 移动端优先的响应式设计

### 应用优化
- 启用Gzip压缩
- 使用CDN加速静态资源
- 配置缓存策略

## 🔄 版本更新

### 2.0.0 (当前版本)
- ✅ 新增用户权限管理系统
- ✅ 优化统计分析功能
- ✅ 改进数据验证逻辑
- ✅ 增强安全性配置
- ✅ 重构代码架构
- ✅ **CSS模块化重构** - 将单一CSS文件拆分为9个功能模块
- ✅ **响应式设计优化** - 改进移动端和平板端体验
- ✅ **样式组件化** - 建立可复用的UI组件库

### 1.x.x (历史版本)
- 基础的面积计算功能
- 简单的数据录入界面
- Excel报告生成

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 技术支持

- **项目仓库**: [GitHub Repository](https://github.com/your-username/school-area-calculator)
- **问题反馈**: [Issues](https://github.com/your-username/school-area-calculator/issues)
- **开发文档**: [Wiki](https://github.com/your-username/school-area-calculator/wiki)

---

**开发团队**: School Area Calculator Team  
**最后更新**: 2025年8月14日  
**版本**: 2.0.0  
**架构更新**: CSS模块化重构完成
