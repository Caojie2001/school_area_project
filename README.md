# 高校建筑面积缺口测算系统

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

一个现代化的Web应用程序，用于高校建筑面积缺口分析与计算。支持在线数据录入、自动标准化计算、智能缺口分析和专业报告生成。

## 核心功能

### 学校信息管理
- **多类型学校支持** - 综合类、理工类、农业类等多种院校类型
- **学生数据统计** - 全日制学生、留学生分类管理
- **建筑面积录入** - 现有建筑面积详细记录
- **统计年份管理** - 支持学生统计年份和建筑统计年份独立设置

### 智能测算分析
- **标准化计算** - 基于教育部标准的自动化面积计算
- **五类建筑分析** - 教学、办公、宿舍、生活、后勤用房全覆盖
- **缺口分析** - 精确计算各类建筑面积缺口
- **达标评估** - 自动判断各类用房达标情况
- **特殊补助** - 支持特殊用房补助项目动态添加

### 用户权限管理
- **多角色系统** - 管理员、基建中心、学校用户三级权限
- **安全认证** - 基于Session的用户认证机制
- **数据隔离** - 不同角色用户数据访问权限控制
- **用户管理** - 完整的用户增删改查功能

### 统计分析功能
- **多维度筛选** - 按年份、用户类型灵活筛选数据
- **汇总统计** - 自动计算总面积、缺口等关键指标
- **趋势分析** - 支持历史数据对比分析
- **数据导出** - 生成Excel格式的专业分析报告

### 数据管理
- **历史记录** - 完整的数据修改历史追踪
- **批量操作** - 支持数据批量导入导出
- **数据验证** - 完善的数据完整性检查
- **备份恢复** - 支持数据备份和恢复功能

## 技术架构

### 后端技术栈
```
Node.js 16+              服务器运行环境
Express.js 4.18+         Web应用框架
MySQL 8.0+               关系型数据库
mysql2 3.14+             MySQL连接驱动
bcrypt 6.0+              密码加密
express-session          会话管理
xlsx 0.18+               Excel文件处理
cors 2.8+                跨域资源共享
```

### 前端技术栈
```
HTML5                    语义化页面结构
CSS3                     现代化样式设计
JavaScript ES6+          原生JS交互逻辑
Fetch API                异步数据通信
响应式设计               多设备屏幕适配
模块化架构               按功能拆分的组件结构
```

### 数据库设计
```
school_info              学校信息与测算结果主表
special_subsidies        特殊补助信息表
users                    用户信息与权限表
索引优化                 查询性能优化
```

## 项目结构

```
school_area_project/
├── 核心服务文件
│   ├── server.js                    Express服务器主文件
│   └── install.sh                   自动安装配置脚本
│
├── 配置模块
│   └── config/
│       ├── database.js              MySQL数据库连接配置
│       ├── authService.js           用户认证服务
│       ├── dataService.js           数据访问层服务
│       ├── routes.js                路由配置
│       ├── appConfig.js             应用配置
│       └── .env.example             环境变量配置模板
│
├── 前端资源
│   └── public/
│       ├── index.html               主应用界面（SPA架构）
│       ├── login.html               用户登录页面
│       │
│       ├── html/                    页面组件
│       │   └── user-management.html 用户管理页面
│       │
│       ├── css/                     样式文件
│       │   ├── main.css             主样式文件
│       │   ├── components.css       组件样式
│       │   ├── forms.css            表单样式
│       │   ├── tables.css           表格样式
│       │   └── responsive.css       响应式样式
│       │
│       ├── js/                      JavaScript模块
│       │   └── main.js              主交互脚本
│       │
│       ├── components/              可复用组件
│       │
│       └── assets/                  静态资源
│           └── login_background.jpg 登录背景图片
│
├── 数据文件
│   ├── data/                        基础数据
│   ├── uploads/                     文件上传目录
│   ├── output/                      Excel报告输出目录
│   └── backups/                     备份文件目录
│
├── 项目配置
│   ├── package.json                 项目依赖和脚本配置
│   ├── package-lock.json            依赖版本锁定文件
│   ├── .env                         环境变量配置文件
│   ├── .gitignore                   Git版本控制忽略规则
│   └── README.md                    项目说明文档
│
└── node_modules/                    依赖包目录
```

## 快速开始

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
cp config/.env.example .env

# 3. 编辑数据库配置
nano .env
```

### 数据库配置

1. **创建数据库**
```sql
CREATE DATABASE school_area_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **配置环境变量** (.env)
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

## 使用指南

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

## 系统配置

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

## 故障排除

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

## 性能优化

### 数据库优化
- 使用索引优化查询性能
- 定期清理过期数据
- 配置适当的连接池大小

### 前端性能优化
- **模块化加载**: 按需加载CSS和JavaScript文件
- **文件压缩**: 生产环境下压缩静态文件
- **缓存策略**: 配置适当的静态资源缓存
- **响应式优化**: 移动端优先的响应式设计

### 应用优化
- 启用Gzip压缩
- 使用CDN加速静态资源
- 配置缓存策略

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 技术支持

- **项目仓库**: [GitHub Repository](https://github.com/Caojie2001/school_area_project)
- **问题反馈**: [Issues](https://github.com/Caojie2001/school_area_project/issues)
- **开发文档**: [Wiki](https://github.com/Caojie2001/school_area_project/wiki)

---

**开发团队**: School Area Calculator Team  
**最后更新**: 2025年8月15日
