const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接配置
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_area_db',
    charset: 'utf8mb4',
    timezone: '+08:00'
};

let pool = null;

// 初始化数据库
async function initializeDatabase() {
    try {
        // 首先连接到MySQL服务器创建我们的数据库
        const tempConfig = { ...config };
        delete tempConfig.database; // 先不指定数据库
        const tempConnection = await mysql.createConnection(tempConfig);
        
        // 创建我们的数据库
        await tempConnection.execute(`
            CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'school_area_db'}\` 
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        console.log(`数据库${process.env.DB_NAME || 'school_area_db'}已确保存在`);
        
        // 关闭临时连接
        await tempConnection.end();
        
        return true;
    } catch (error) {
        console.error('数据库创建失败:', error.message);
        console.log('将尝试连接默认数据库');
        return false;
    }
}

// 获取连接池
async function getPool() {
}

// 获取数据库连接池
async function getPool() {
    if (!pool) {
        try {
            console.log('正在连接数据库...', {
                host: config.host,
                port: config.port,
                user: config.user,
                database: config.database
            });
            
            // 如果要连接到school_area_db，先确保它存在
            if (config.database === 'school_area_db') {
                await initializeDatabase();
            }
            
            pool = mysql.createPool({
                ...config,
                connectionLimit: 10,
                queueLimit: 0
            });
            console.log('数据库连接成功');
        } catch (error) {
            console.error('数据库连接失败:', error.message);
            throw error;
        }
    }
    return pool;
}

// 测试数据库连接
async function testConnection() {
    try {
        const pool = await getPool();
        await pool.execute('SELECT 1 as test');
        console.log('MySQL数据库连接成功！');
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error.message);
        return false;
    }
}

// 初始化数据库表
async function initializeTables() {
    try {
        const pool = await getPool();
        
        // 创建学校信息表
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS school_info (
                id INT AUTO_INCREMENT PRIMARY KEY,
                school_name VARCHAR(100) NOT NULL,
                school_type VARCHAR(50),
                year INT,
                base_year INT,
                full_time_undergraduate INT DEFAULT 0,
                full_time_specialist INT DEFAULT 0,
                full_time_master INT DEFAULT 0,
                full_time_doctor INT DEFAULT 0,
                international_undergraduate INT DEFAULT 0,
                international_specialist INT DEFAULT 0,
                international_master INT DEFAULT 0,
                international_doctor INT DEFAULT 0,
                total_students INT DEFAULT 0,
                teaching_area DECIMAL(12,2) DEFAULT 0,
                office_area DECIMAL(12,2) DEFAULT 0,
                total_living_area DECIMAL(12,2) DEFAULT 0,
                dormitory_area DECIMAL(12,2) DEFAULT 0,
                logistics_area DECIMAL(12,2) DEFAULT 0,
                current_building_area DECIMAL(12,2) DEFAULT 0,
                required_building_area DECIMAL(12,2) DEFAULT 0,
                teaching_area_gap DECIMAL(12,2) DEFAULT 0,
                office_area_gap DECIMAL(12,2) DEFAULT 0,
                dormitory_area_gap DECIMAL(12,2) DEFAULT 0,
                other_living_area_gap DECIMAL(12,2) DEFAULT 0,
                logistics_area_gap DECIMAL(12,2) DEFAULT 0,
                total_area_gap DECIMAL(12,2) DEFAULT 0,
                special_subsidy_total DECIMAL(12,2) DEFAULT 0,
                overall_compliance BOOLEAN DEFAULT FALSE,
                calculation_results LONGTEXT,
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 为现有表添加base_year字段（如果不存在）
        try {
            await pool.execute(`
                ALTER TABLE school_info ADD COLUMN base_year INT AFTER year;
            `);
            console.log('base_year字段已添加到school_info表');
        } catch (err) {
            if (err.message.includes('Duplicate column name')) {
                console.log('base_year字段已存在，跳过添加');
            } else {
                console.warn('添加base_year字段失败:', err.message);
            }
        }

        // 创建特殊补助表
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS special_subsidies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                school_info_id INT NOT NULL,
                subsidy_name VARCHAR(200) NOT NULL,
                subsidy_area DECIMAL(12,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (school_info_id) REFERENCES school_info(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 创建索引（MySQL兼容方式）
        try {
            await pool.execute(`
                CREATE INDEX idx_school_info_name_year ON school_info(school_name, year);
            `);
        } catch (err) {
            if (!err.message.includes('Duplicate key name')) {
                console.warn('创建索引 idx_school_info_name_year 失败:', err.message);
            }
        }

        try {
            await pool.execute(`
                CREATE INDEX idx_school_info_year ON school_info(year);
            `);
        } catch (err) {
            if (!err.message.includes('Duplicate key name')) {
                console.warn('创建索引 idx_school_info_year 失败:', err.message);
            }
        }

        try {
            await pool.execute(`
                CREATE INDEX idx_special_subsidies_school_id ON special_subsidies(school_info_id);
            `);
        } catch (err) {
            if (!err.message.includes('Duplicate key name')) {
                console.warn('创建索引 idx_special_subsidies_school_id 失败:', err.message);
            }
        }

        console.log('数据库表初始化完成');

    } catch (error) {
        console.error('数据库表初始化失败:', error.message);
        // 不抛出错误，让应用继续运行
        console.log('应用将在无数据库模式下运行');
    }
}

module.exports = {
    getPool,
    testConnection,
    initializeTables
};
