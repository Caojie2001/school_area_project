const { getPool } = require('./config/database');

async function analyzeBackupAndView() {
    console.log('🔍 分析 school_info_backup 和 school_info_view 的作用...');
    
    try {
        const pool = await getPool();
        const connection = await pool.getConnection();
        
        // 1. 分析 school_info_backup 表
        console.log('\n📋 1. school_info_backup 表分析：');
        
        // 检查表结构差异
        const [backupColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'school_area_management' 
              AND TABLE_NAME = 'school_info_backup'
            ORDER BY ORDINAL_POSITION
        `);
        
        const [historyColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'school_area_management' 
              AND TABLE_NAME = 'calculation_history'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log(`backup表字段数: ${backupColumns.length}`);
        console.log(`history表字段数: ${historyColumns.length}`);
        
        // 找出差异字段
        const backupFieldNames = backupColumns.map(col => col.COLUMN_NAME);
        const historyFieldNames = historyColumns.map(col => col.COLUMN_NAME);
        
        const onlyInBackup = backupFieldNames.filter(name => !historyFieldNames.includes(name));
        const onlyInHistory = historyFieldNames.filter(name => !backupFieldNames.includes(name));
        
        console.log('\n只在 backup 表中的字段:', onlyInBackup);
        console.log('只在 history 表中的字段:', onlyInHistory);
        
        // 检查 backup 表的数据
        const [backupData] = await connection.execute(`
            SELECT COUNT(*) as total_count,
                   MIN(created_at) as earliest_record,
                   MAX(created_at) as latest_record,
                   COUNT(DISTINCT school_name) as unique_schools,
                   COUNT(DISTINCT year) as unique_years
            FROM school_info_backup
        `);
        
        console.log('\nbackup表数据统计:');
        console.log(`- 总记录数: ${backupData[0].total_count}`);
        console.log(`- 最早记录: ${backupData[0].earliest_record}`);
        console.log(`- 最新记录: ${backupData[0].latest_record}`);
        console.log(`- 不同学校数: ${backupData[0].unique_schools}`);
        console.log(`- 不同年份数: ${backupData[0].unique_years}`);
        
        // 检查 overall_compliance 字段
        if (onlyInBackup.includes('overall_compliance')) {
            const [complianceStats] = await connection.execute(`
                SELECT overall_compliance, COUNT(*) as count
                FROM school_info_backup
                GROUP BY overall_compliance
            `);
            console.log('\noverall_compliance 字段分布:');
            complianceStats.forEach(stat => {
                console.log(`- ${stat.overall_compliance}: ${stat.count} 条`);
            });
        }
        
        // 2. 分析 school_info_view 视图
        console.log('\n📋 2. school_info_view 视图分析：');
        
        // 获取视图定义
        const [viewDef] = await connection.execute(`SHOW CREATE VIEW school_info_view`);
        const viewDefinition = viewDef[0]['Create View'];
        
        console.log('\n视图定义（简化）:');
        console.log('- 基于 calculation_history 和 school_registry 表的 JOIN');
        console.log('- 关联条件: ch.school_registry_id = sr.id');
        
        // 检查视图能否正常使用
        try {
            const [viewData] = await connection.execute(`
                SELECT COUNT(*) as view_count,
                       COUNT(DISTINCT school_name) as unique_schools,
                       COUNT(DISTINCT year) as unique_years
                FROM school_info_view
            `);
            
            console.log('\n视图数据统计:');
            console.log(`- 可访问记录数: ${viewData[0].view_count}`);
            console.log(`- 不同学校数: ${viewData[0].unique_schools}`);
            console.log(`- 不同年份数: ${viewData[0].unique_years}`);
        } catch (viewError) {
            console.log('\n视图访问错误:', viewError.message);
        }
        
        // 检查视图中是否还引用了 overall_compliance
        if (viewDefinition.includes('overall_compliance')) {
            console.log('\n⚠️ 视图仍然引用 overall_compliance 字段，但 calculation_history 表中可能没有该字段');
        }
        
        // 3. 分析用途和建议
        console.log('\n💡 3. 用途分析和建议：');
        
        console.log('\nschool_info_backup 表的用途：');
        console.log('- 📦 备份表：保存历史数据的备份');
        console.log('- 🔄 迁移缓存：在系统重构过程中临时保存数据');
        console.log('- 📊 包含已清理的达标字段 (overall_compliance)');
        
        console.log('\nschool_info_view 视图的用途：');
        console.log('- 🔍 查询简化：自动关联学校名称和计算历史');
        console.log('- 📋 数据展示：为前端提供完整的数据视图');
        console.log('- ⚡ 性能优化：避免重复写 JOIN 查询');
        
        console.log('\n建议操作：');
        if (backupData[0].total_count > 0) {
            console.log('✅ 保留 school_info_backup：有历史数据需要备份');
        } else {
            console.log('❓ 考虑删除 school_info_backup：无数据的空备份表');
        }
        
        if (viewDefinition.includes('overall_compliance')) {
            console.log('🔧 需要修复 school_info_view：移除不存在的字段引用');
        } else {
            console.log('✅ school_info_view 正常：可以继续使用');
        }
        
        connection.release();
        
    } catch (error) {
        console.error('❌ 分析过程中出现错误:', error.message);
        console.error('错误详情:', error);
    }
    
    process.exit(0);
}

analyzeBackupAndView();
