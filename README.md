# 高校建筑面积缺口测算系统

一个用于高校建筑面积缺口分析的现代化Web应用程序，支持在线数据录入、自动计算分析和报告生成。

## 功能特点

### 核心功能
- **在线数据录入** - 现代化表单界面，支持多种学校类型
- **学生信息管理** - 详细的全日制/留学生分类统计  
- **建筑面积分析** - 五大类建筑面积标准化计算
- **特殊补助管理** - 动态添加特殊用房补助项目
- **自动缺口分析** - 基于国家标准的智能计算
- **报告生成** - 生成详细的Excel分析报告
- **数据持久化** - 基于MySQL的数据存储

### 系统特性
- **现代化UI** - 响应式设计，支持移动端
- **数据验证** - 完整的表单验证和错误处理
- **多端兼容** - 支持桌面端和移动端访问
- **实时计算** - 数据变化时自动更新计算结果
- **数据管理** - 历史数据查询、编辑和删除功能
- **统计分析** - 多维度数据统计和可视化

## 技术架构

### 后端技术栈
- **Node.js 16+** - 服务器运行环境
- **Express.js** - Web应用框架
- **MySQL 8.0+** - 数据库（支持本地和云端）
- **mysql2** - MySQL连接驱动
- **SheetJS (xlsx)** - Excel文件处理
- **CORS** - 跨域资源共享

### 前端技术栈
- **HTML5** - 语义化页面结构
- **CSS3** - 现代化样式和布局
- **JavaScript (ES6+)** - 原生JS交互逻辑
- **Fetch API** - 异步数据通信
- **响应式设计** - 适配多种设备

### 数据库设计
- **school_info** - 学校基本信息和计算结果
- **special_subsidies** - 特殊补助信息
- **索引优化** - 查询性能优化
- **事务支持** - 数据一致性保障

## 项目结构

```
高校建筑面积缺口测算系统/
├── server.js                      # Express服务器主文件
├── database.js                    # MySQL数据库连接和配置
├── dataService.js                 # 数据访问层服务
├── dataService_sqlserver_backup.js # SQL Server备份版本
├── package.json                   # 项目依赖和脚本配置
├── package-lock.json              # 依赖版本锁定文件
├── install.sh                     # 自动安装配置脚本
├── .env                           # 环境变量配置文件（需手动创建）
├── .env.example                   # 环境变量配置模板
├── .gitignore                     # Git版本控制忽略规则
├── README.md                      # 项目说明文档
│
├── public/                        # 前端静态资源目录
│   ├── index.html                 # 主应用页面
│   └── script.js                  # 前端核心交互脚本
│
├── output/                        # Excel报告输出目录（自动创建）
└── node_modules/                  # NPM依赖包目录（自动生成）
```

## 快速开始

### 环境要求
- Node.js 16.0+
- npm 或 yarn
- MySQL 8.0+

### 安装步骤

#### 方式一：使用安装脚本（推荐）
```bash
# 克隆或下载项目后运行
chmod +x install.sh
./install.sh
```

#### 方式二：手动安装
```bash
# 1. 安装依赖
npm install

# 2. 复制环境配置文件
cp .env.example .env

# 3. 编辑环境配置
nano .env
```

### 配置数据库

1. 确保MySQL服务正在运行
2. 创建数据库（可选，应用会自动创建）：
```sql
CREATE DATABASE school_area_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 配置 `.env` 文件：
```env
# 服务器端口
PORT=3000

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_area_management

# 文件存储路径
OUTPUT_DIR=output

# 保留的历史文件数量
KEEP_FILES_COUNT=5
```

### 启动应用

```bash
# 启动服务器
node server.js

# 或使用npm脚本
npm start
```

应用启动后，访问 http://localhost:3000

## 数据库表结构

### school_info 表
存储学校基本信息和计算结果
```sql
CREATE TABLE school_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_name VARCHAR(100) NOT NULL,
    school_type VARCHAR(50),
    year INT,
    full_time_undergraduate INT DEFAULT 0,
    full_time_specialist INT DEFAULT 0,
    full_time_master INT DEFAULT 0,
    full_time_doctor INT DEFAULT 0,
    international_undergraduate INT DEFAULT 0,
    international_specialist INT DEFAULT 0,
    international_master INT DEFAULT 0,
    international_doctor INT DEFAULT 0,
    total_students INT DEFAULT 0,
    teaching_area DECIMAL(12,2) DEFAULT 0.00,
    office_area DECIMAL(12,2) DEFAULT 0.00,
    total_living_area DECIMAL(12,2) DEFAULT 0.00,
    dormitory_area DECIMAL(12,2) DEFAULT 0.00,
    logistics_area DECIMAL(12,2) DEFAULT 0.00,
    current_building_area DECIMAL(12,2) DEFAULT 0.00,
    required_building_area DECIMAL(12,2) DEFAULT 0.00,
    teaching_area_gap DECIMAL(12,2) DEFAULT 0.00,
    office_area_gap DECIMAL(12,2) DEFAULT 0.00,
    dormitory_area_gap DECIMAL(12,2) DEFAULT 0.00,
    other_living_area_gap DECIMAL(12,2) DEFAULT 0.00,
    logistics_area_gap DECIMAL(12,2) DEFAULT 0.00,
    total_area_gap DECIMAL(12,2) DEFAULT 0.00,
    special_subsidy_total DECIMAL(12,2) DEFAULT 0.00,
    overall_compliance BOOLEAN DEFAULT false,
    calculation_results LONGTEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### special_subsidies 表
存储特殊补助信息
```sql
CREATE TABLE special_subsidies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_info_id INT NOT NULL,
    subsidy_name VARCHAR(200) NOT NULL,
    subsidy_amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_info_id) REFERENCES school_info(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## API接口

### 数据录入
- `POST /api/submit` - 提交学校数据
- `GET /api/data` - 获取学校数据列表
- `GET /api/data/:id` - 获取指定学校数据
- `PUT /api/data/:id` - 更新学校数据
- `DELETE /api/data/:id` - 删除学校数据

### 特殊补助
- `GET /api/subsidies/:schoolId` - 获取学校特殊补助
- `POST /api/subsidies` - 添加特殊补助
- `DELETE /api/subsidies/:id` - 删除特殊补助

### 报告生成
- `POST /api/generate-report` - 生成Excel报告
- `GET /api/export-data` - 导出所有数据

### 统计分析
- `GET /api/statistics` - 获取统计数据

## 计算标准

### 基础指标（平方米/生）

| 学校类型 | A（教学） | B（办公） | C1（宿舍） | C2（其他生活） | D（后勤） |
|---------|-----------|-----------|------------|---------------|-----------|
| 医学院校 | 16        | 1.6       | 6.5        | 1.3           | 1.3       |
| 师范院校 | 14        | 1.4       | 6.5        | 1.3           | 1.3       |
| 农林院校 | 16        | 1.6       | 6.5        | 1.3           | 1.3       |
| 工科院校 | 18        | 1.8       | 6.5        | 1.3           | 1.3       |
| 财经院校 | 9         | 0.9       | 6.5        | 1.3           | 1.3       |
| 政法院校 | 9         | 0.9       | 6.5        | 1.3           | 1.3       |
| 体育院校 | 22        | 2.2       | 6.5        | 1.3           | 1.3       |
| 艺术院校 | 18        | 1.8       | 6.5        | 1.3           | 1.3       |
| 民族院校 | 14        | 1.4       | 6.5        | 1.3           | 1.3       |
| 语言院校 | 9         | 0.9       | 6.5        | 1.3           | 1.3       |
| 综合院校 | 14        | 1.4       | 6.5        | 1.3           | 1.3       |

### 特殊补助标准（平方米/生）

针对硕士生、博士生和留学生的额外补助：
- **教学用房**：硕士生 5.0，博士生 8.0，留学生 3.0
- **办公用房**：硕士生 0.5，博士生 0.8，留学生 0.3
- **宿舍用房**：硕士生 7.0，博士生 12.0，留学生 8.0
- **其他生活用房**：硕士生 1.5，博士生 2.5，留学生 1.5
- **后勤用房**：硕士生 1.5，博士生 2.5，留学生 1.5

## 开发说明

### 目录说明
- `server.js` - Express服务器主文件，包含所有API路由
- `database.js` - 数据库连接配置和表初始化
- `dataService.js` - 数据访问层，封装所有数据库操作
- `public/index.html` - 前端主页面，包含表单和界面
- `public/script.js` - 前端交互逻辑和API调用
- `output/` - 生成的Excel报告存储目录

### 主要功能模块
1. **数据录入模块** - 学校基本信息和建筑面积录入
2. **计算模块** - 基于国家标准的面积缺口计算
3. **特殊补助模块** - 动态管理特殊用房补助
4. **数据管理模块** - 历史数据查询、编辑、删除
5. **报告生成模块** - Excel格式的分析报告生成
6. **统计分析模块** - 多维度数据统计和展示

## 更新日志

### v2.0.0 (2025-08-04)
- 迁移至MySQL数据库
- 移除批量下载功能
- 优化数据库连接性能
- 更新启动提示信息

### v1.0.0
- 初始版本发布
- 基础数据录入和计算功能
- Excel报告生成
- 响应式Web界面

## 许可证

MIT License

## 技术支持

如需技术支持或有问题反馈，请查看项目文档或联系开发团队。
