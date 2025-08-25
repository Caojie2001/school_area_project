const { getPool } = require('./config/database');

async function exportDatabaseSchema() {
    console.log('📋 导出当前数据库架构...');
    
    try {
        const pool = await getPool();
        const connection = await pool.getConnection();
        
        // 1. 获取所有表名
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'school_area_management'
            ORDER BY TABLE_NAME
        `);
        
        console.log(`\n找到 ${tables.length} 个表：`);
        tables.forEach(table => console.log(`- ${table.TABLE_NAME}`));
        
        let sqlScript = `-- ========================================\n`;
        sqlScript += `-- 学校面积测算系统数据库结构\n`;
        sqlScript += `-- 更新时间: ${new Date().toISOString()}\n`;
        sqlScript += `-- ========================================\n\n`;
        
        sqlScript += `-- 创建数据库\n`;
        sqlScript += `CREATE DATABASE IF NOT EXISTS school_area_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
        sqlScript += `USE school_area_management;\n\n`;
        
        // 2. 为每个表获取创建语句
        for (const table of tables) {
            console.log(`\n处理表: ${table.TABLE_NAME}`);
            
            try {
                const [createTable] = await connection.execute(`SHOW CREATE TABLE ${table.TABLE_NAME}`);
                let createStatement = createTable[0]['Create Table'] || createTable[0]['Create View'];
                
                if (!createStatement) {
                    console.log(`跳过表 ${table.TABLE_NAME}：无法获取创建语句`);
                    continue;
                }
                
                // 添加 IF NOT EXISTS (只对表有效，视图不需要)
                if (createTable[0]['Create Table']) {
                    createStatement = createStatement.replace(/^CREATE TABLE/, 'CREATE TABLE IF NOT EXISTS');
                }
                
                sqlScript += `-- ========================================\n`;
                sqlScript += `-- ${createTable[0]['Create View'] ? '视图' : '表'}: ${table.TABLE_NAME}\n`;
                sqlScript += `-- ========================================\n`;
                sqlScript += createStatement + ';\n\n';
                
                // 获取表的记录数（视图可能无法计算）
                try {
                    const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table.TABLE_NAME}`);
                    sqlScript += `-- 当前记录数: ${count[0].count}\n\n`;
                } catch (countError) {
                    sqlScript += `-- 记录数: 无法计算\n\n`;
                }
            } catch (tableError) {
                console.log(`跳过表 ${table.TABLE_NAME}：${tableError.message}`);
                sqlScript += `-- 表 ${table.TABLE_NAME} 无法导出\n\n`;
            }
        }
        
        // 3. 添加索引信息
        sqlScript += `-- ========================================\n`;
        sqlScript += `-- 重要索引\n`;
        sqlScript += `-- ========================================\n`;
        
        for (const table of tables) {
            const [indexes] = await connection.execute(`
                SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
                FROM information_schema.STATISTICS 
                WHERE TABLE_SCHEMA = 'school_area_management' 
                  AND TABLE_NAME = '${table.TABLE_NAME}'
                  AND INDEX_NAME != 'PRIMARY'
                ORDER BY INDEX_NAME, SEQ_IN_INDEX
            `);
            
            if (indexes.length > 0) {
                sqlScript += `-- 表 ${table.TABLE_NAME} 的索引\n`;
                const indexGroups = {};
                indexes.forEach(idx => {
                    if (!indexGroups[idx.INDEX_NAME]) {
                        indexGroups[idx.INDEX_NAME] = {
                            unique: idx.NON_UNIQUE === 0,
                            columns: []
                        };
                    }
                    indexGroups[idx.INDEX_NAME].columns.push(idx.COLUMN_NAME);
                });
                
                Object.entries(indexGroups).forEach(([indexName, info]) => {
                    const uniqueText = info.unique ? 'UNIQUE ' : '';
                    sqlScript += `-- CREATE ${uniqueText}INDEX ${indexName} ON ${table.TABLE_NAME} (${info.columns.join(', ')});\n`;
                });
                sqlScript += '\n';
            }
        }
        
        // 4. 添加外键约束信息
        sqlScript += `-- ========================================\n`;
        sqlScript += `-- 外键约束\n`;
        sqlScript += `-- ========================================\n`;
        
        const [foreignKeys] = await connection.execute(`
            SELECT 
                CONSTRAINT_NAME,
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = 'school_area_management'
              AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY TABLE_NAME, CONSTRAINT_NAME
        `);
        
        if (foreignKeys.length > 0) {
            foreignKeys.forEach(fk => {
                sqlScript += `-- ALTER TABLE ${fk.TABLE_NAME} ADD CONSTRAINT ${fk.CONSTRAINT_NAME} `;
                sqlScript += `FOREIGN KEY (${fk.COLUMN_NAME}) REFERENCES ${fk.REFERENCED_TABLE_NAME}(${fk.REFERENCED_COLUMN_NAME});\n`;
            });
        } else {
            sqlScript += `-- 当前没有外键约束\n`;
        }
        
        sqlScript += `\n-- ========================================\n`;
        sqlScript += `-- 数据库架构导出完成\n`;
        sqlScript += `-- ========================================\n`;
        
        connection.release();
        return sqlScript;
        
    } catch (error) {
        console.error('❌ 导出数据库架构失败:', error.message);
        throw error;
    }
}

exportDatabaseSchema().then(sqlScript => {
    console.log('\n✅ 数据库架构导出完成');
    
    // 写入文件
    const fs = require('fs');
    fs.writeFileSync('./updated_db.sql', sqlScript, 'utf8');
    console.log('SQL脚本已保存到: updated_db.sql');
    
    process.exit(0);
}).catch(error => {
    console.error('导出失败:', error);
    process.exit(1);
});
