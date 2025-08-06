const { getPool } = require('./database');

// 保存学校信息（包含计算结果）
async function saveSchoolInfo(schoolData, specialSubsidies = [], calculationResults = null) {
    const pool = await getPool();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 首先删除同一学校-测算年份组合的旧记录
        const schoolName = schoolData['学校名称'];
        const year = schoolData['年份'];
        
        console.log(`删除旧记录: 学校=${schoolName}, 测算年份=${year}`);
        
        // 获取要删除的记录ID（用于删除关联的特殊补助记录）
        const [existingRecords] = await connection.execute(`
            SELECT id FROM school_info 
            WHERE school_name = ? AND year = ?
        `, [schoolName, year]);
        
        // 删除关联的特殊补助记录
        if (existingRecords.length > 0) {
            const recordIds = existingRecords.map(record => record.id);
            const placeholders = recordIds.map(() => '?').join(',');
            await connection.execute(`
                DELETE FROM special_subsidies 
                WHERE school_info_id IN (${placeholders})
            `, recordIds);
            
            console.log(`删除了 ${recordIds.length} 条旧记录的特殊补助数据`);
        }
        
        // 删除主记录
        const [deleteResult] = await connection.execute(`
            DELETE FROM school_info 
            WHERE school_name = ? AND year = ?
        `, [schoolName, year]);
        
        console.log(`删除了 ${deleteResult.affectedRows} 条学校主记录`);
        
        // 准备计算结果数据
        let calcData = {
            current_building_area: 0,
            required_building_area: 0,
            teaching_area_gap: 0,
            office_area_gap: 0,
            dormitory_area_gap: 0,
            other_living_area_gap: 0,
            logistics_area_gap: 0,
            total_area_gap: 0,
            special_subsidy_total: 0,
            overall_compliance: 0,
            calculation_results: null
        };
        
        if (calculationResults) {
            calcData.current_building_area = calculationResults['现有建筑总面积'] || 0;
            calcData.required_building_area = calculationResults['应配建筑总面积'] || 0;
            calcData.teaching_area_gap = calculationResults['教学及辅助用房缺口(A)'] || 0;
            calcData.office_area_gap = calculationResults['办公用房缺口(B)'] || 0;
            calcData.dormitory_area_gap = calculationResults['学生宿舍缺口(C1)'] || 0;
            calcData.other_living_area_gap = calculationResults['其他生活用房缺口(C2)'] || 0;
            calcData.logistics_area_gap = calculationResults['后勤辅助用房缺口(D)'] || 0;
            calcData.total_area_gap = calculationResults['建筑面积总缺口（含特殊补助）'] || 0;
            calcData.special_subsidy_total = calculationResults['特殊补助总面积'] || 0;
            calcData.overall_compliance = calculationResults['整体达标情况'] === '达标' ? 1 : 0;
            calcData.calculation_results = JSON.stringify(calculationResults);
        }
        
        console.log('准备插入的数据:', {
            schoolName: schoolData['学校名称'],
            year: schoolData['年份'],
            calcData: calcData
        });
        
        // 构建参数数组
        const params = [
            schoolData['学校名称'],
            schoolData['学校类型'] || null,
            schoolData['年份'],
            schoolData['基准年份'] || schoolData['年份'],
            schoolData['全日制本专科生人数'] || 0,
            schoolData['全日制专科生人数'] || 0,
            schoolData['全日制硕士生人数'] || 0,
            schoolData['全日制博士生人数'] || 0,
            schoolData['留学生本科生人数'] || 0,
            schoolData['留学生专科生人数'] || 0,
            schoolData['留学生硕士生人数'] || 0,
            schoolData['留学生博士生人数'] || 0,
            schoolData['学生总人数'] || 0,
            schoolData['现有教学及辅助用房面积'] || 0,
            schoolData['现有办公用房面积'] || 0,
            schoolData['现有生活用房总面积'] || 0,
            schoolData['现有学生宿舍面积'] || 0,
            schoolData['现有后勤辅助用房面积'] || 0,
            schoolData['备注'] || null,
            // 计算结果
            calcData.current_building_area || 0,
            calcData.required_building_area || 0,
            calcData.teaching_area_gap || 0,
            calcData.office_area_gap || 0,
            calcData.dormitory_area_gap || 0,
            calcData.other_living_area_gap || 0,
            calcData.logistics_area_gap || 0,
            calcData.total_area_gap || 0,
            calcData.special_subsidy_total || 0,
            calcData.overall_compliance || 0,
            calcData.calculation_results || null
        ];
        
        // 检查是否有undefined值
        const undefinedIndex = params.findIndex(param => param === undefined);
        if (undefinedIndex !== -1) {
            console.log(`参数数组中第${undefinedIndex}个参数是undefined:`, params[undefinedIndex]);
            console.log('完整参数数组:', params);
            throw new Error(`参数数组中第${undefinedIndex}个参数是undefined`);
        }
        
        // 插入新记录
        const [schoolResult] = await connection.execute(`
            INSERT INTO school_info (
                school_name, school_type, year, base_year, full_time_undergraduate, full_time_specialist, 
                full_time_master, full_time_doctor, international_undergraduate, international_specialist,
                international_master, international_doctor, total_students, teaching_area, 
                office_area, total_living_area, dormitory_area, logistics_area, remarks,
                current_building_area, required_building_area, teaching_area_gap, office_area_gap,
                dormitory_area_gap, other_living_area_gap, logistics_area_gap, total_area_gap,
                special_subsidy_total, overall_compliance, calculation_results
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, params);
        
        const schoolInfoId = schoolResult.insertId;
        
        // 插入特殊补助信息
        if (specialSubsidies && specialSubsidies.length > 0) {
            for (const subsidy of specialSubsidies) {
                await connection.execute(`
                    INSERT INTO special_subsidies (school_info_id, subsidy_name, subsidy_area)
                    VALUES (?, ?, ?)
                `, [
                    schoolInfoId,
                    subsidy['特殊用房补助名称'] || subsidy.name || subsidy['name'],
                    subsidy['补助面积（m²）'] || subsidy.area || subsidy['area']
                ]);
            }
        }
        
        await connection.commit();
        return schoolInfoId;
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// 获取学校信息历史记录
async function getSchoolHistory(year = null) {
    const pool = await getPool();
    
    try {
        let query = `
            SELECT 
                si.id,
                si.school_name,
                si.school_type,
                si.year,
                si.full_time_undergraduate,
                si.full_time_specialist,
                si.full_time_master,
                si.full_time_doctor,
                si.international_undergraduate,
                si.international_specialist,
                si.international_master,
                si.international_doctor,
                si.total_students,
                si.teaching_area,
                si.office_area,
                si.total_living_area,
                si.dormitory_area,
                si.logistics_area,
                si.current_building_area,
                si.required_building_area,
                si.teaching_area_gap,
                si.office_area_gap,
                si.dormitory_area_gap,
                si.other_living_area_gap,
                si.logistics_area_gap,
                si.total_area_gap,
                si.special_subsidy_total,
                si.overall_compliance,
                si.calculation_results,
                si.remarks,
                si.created_at,
                GROUP_CONCAT(
                    CONCAT('{"特殊用房补助名称":"', ss.subsidy_name, '","补助面积（m²）":', ss.subsidy_area, '}')
                    SEPARATOR ','
                ) as special_subsidies_json
            FROM school_info si
            LEFT JOIN special_subsidies ss ON si.id = ss.school_info_id
        `;
        
        let params = [];
        if (year) {
            query += ' WHERE si.year = ?';
            params.push(year);
        }
        
        query += `
            GROUP BY si.id
            ORDER BY si.created_at DESC, si.school_name ASC
        `;
        
        const [rows] = await pool.execute(query, params);
        
        // 处理特殊补助数据
        const results = rows.map(row => ({
            ...row,
            special_subsidies: row.special_subsidies_json ? 
                `[${row.special_subsidies_json}]` : '[]'
        }));
        
        return results;
        
    } catch (error) {
        console.error('获取学校历史记录失败:', error);
        throw error;
    }
}

// 获取最新的学校记录
async function getLatestSchoolRecords(year = null, schoolName = null, baseYear = null) {
    const pool = await getPool();
    
    try {
        let query = `
            SELECT 
                si.*,
                GROUP_CONCAT(
                    CONCAT('{"特殊用房补助名称":"', ss.subsidy_name, '","补助面积（m²）":', ss.subsidy_area, '}')
                    SEPARATOR ','
                ) as special_subsidies_json
            FROM school_info si
            LEFT JOIN special_subsidies ss ON si.id = ss.school_info_id
            INNER JOIN (
                SELECT school_name, year, MAX(created_at) as max_created_at
                FROM school_info
        `;
        
        let params = [];
        let whereConditions = [];
        
        if (year) {
            whereConditions.push('year = ?');
            params.push(year);
        }
        
        if (schoolName) {
            whereConditions.push('school_name = ?');
            params.push(schoolName);
        }
        
        // 注意：baseYear参数被忽略，因为我们现在只根据学校名称和测算年份获取最新记录
        
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        query += `
                GROUP BY school_name, year
            ) latest ON si.school_name = latest.school_name 
                     AND si.year = latest.year
                     AND si.created_at = latest.max_created_at
        `;
        
        // 再次添加筛选条件到主查询
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.map(condition => 'si.' + condition).join(' AND ');
            // 重复参数
            params = [...params, ...params];
        }
        
        query += `
            GROUP BY si.id
            ORDER BY si.year DESC, si.school_name ASC
        `;
        
        const [rows] = await pool.execute(query, params);
        
        // 处理特殊补助数据
        const results = rows.map(row => ({
            ...row,
            special_subsidies: row.special_subsidies_json ? 
                `[${row.special_subsidies_json}]` : '[]'
        }));
        
        return results;
        
    } catch (error) {
        console.error('获取最新学校记录失败:', error);
        throw error;
    }
}

// 获取所有学校记录（不限制为最新记录）
async function getAllSchoolRecords(year = null, schoolName = null) {
    const pool = await getPool();
    
    try {
        let query = `
            SELECT 
                si.*,
                GROUP_CONCAT(
                    CONCAT('{"特殊用房补助名称":"', ss.subsidy_name, '","补助面积（m²）":', ss.subsidy_area, '}')
                    SEPARATOR ','
                ) as special_subsidies_json
            FROM school_info si
            LEFT JOIN special_subsidies ss ON si.id = ss.school_info_id
        `;
        
        let params = [];
        let whereConditions = [];
        
        if (year) {
            whereConditions.push('si.year = ?');
            params.push(year);
        }
        
        if (schoolName) {
            whereConditions.push('si.school_name = ?');
            params.push(schoolName);
        }
        
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        query += `
            GROUP BY si.id
            ORDER BY si.school_name ASC, si.year DESC, si.created_at DESC
        `;
        
        const [rows] = await pool.execute(query, params);
        
        // 处理特殊补助数据
        const results = rows.map(row => ({
            ...row,
            special_subsidies: row.special_subsidies_json ? 
                `[${row.special_subsidies_json}]` : '[]'
        }));
        
        return results;
        
    } catch (error) {
        console.error('获取所有学校记录失败:', error);
        throw error;
    }
}

// 获取可用年份列表
async function getAvailableYears() {
    const pool = await getPool();
    
    try {
        const [rows] = await pool.execute(`
            SELECT DISTINCT year 
            FROM school_info 
            WHERE year IS NOT NULL 
            ORDER BY year DESC
        `);
        
        return rows.map(row => row.year);
    } catch (error) {
        console.error('获取可用年份失败:', error);
        return [];
    }
}

// 获取可用基准年份
async function getAvailableBaseYears() {
    const pool = await getPool();
    
    try {
        const [rows] = await pool.execute(`
            SELECT DISTINCT base_year 
            FROM school_info 
            WHERE base_year IS NOT NULL 
            ORDER BY base_year DESC
        `);
        
        return rows.map(row => row.base_year);
    } catch (error) {
        console.error('获取可用基准年份失败:', error);
        return [];
    }
}

// 获取特殊补助信息
async function getSpecialSubsidies(schoolInfoId) {
    const pool = await getPool();
    
    try {
        const [rows] = await pool.execute(`
            SELECT 
                subsidy_name as '特殊用房补助名称',
                subsidy_area as '补助面积（m²）'
            FROM special_subsidies
            WHERE school_info_id = ?
            ORDER BY id
        `, [schoolInfoId]);
        
        return rows;
    } catch (error) {
        console.error('获取特殊补助信息失败:', error);
        return [];
    }
}

// 获取统计数据
async function getStatistics(year = null) {
    const pool = await getPool();
    
    try {
        let query = `
            SELECT 
                COUNT(*) as total_schools,
                SUM(total_students) as total_students,
                SUM(current_building_area) as total_current_area,
                SUM(required_building_area) as total_required_area,
                SUM(total_area_gap) as total_gap,
                SUM(CASE WHEN overall_compliance = 1 THEN 1 ELSE 0 END) as compliant_schools,
                AVG(total_students) as avg_students,
                AVG(current_building_area) as avg_current_area,
                MIN(year) as earliest_year,
                MAX(year) as latest_year
            FROM school_info
        `;
        
        let params = [];
        if (year) {
            query += ' WHERE year = ?';
            params.push(year);
        }
        
        const [rows] = await pool.execute(query, params);
        const stats = rows[0] || {};
        
        // 获取学校类型统计
        let typeQuery = `
            SELECT 
                school_type,
                COUNT(*) as count,
                SUM(total_students) as students,
                SUM(current_building_area) as current_area,
                SUM(required_building_area) as required_area,
                SUM(total_area_gap) as gap
            FROM school_info
        `;
        
        if (year) {
            typeQuery += ' WHERE year = ?';
        }
        
        typeQuery += ' GROUP BY school_type ORDER BY count DESC';
        
        const [typeRows] = await pool.execute(typeQuery, params);
        
        return {
            overall: stats,
            by_type: typeRows
        };
        
    } catch (error) {
        console.error('获取统计数据失败:', error);
        throw error;
    }
}

// 删除学校记录
async function deleteSchoolRecord(id) {
    const pool = await getPool();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 先删除特殊补助记录（由于外键约束，MySQL会自动删除）
        await connection.execute('DELETE FROM special_subsidies WHERE school_info_id = ?', [id]);
        
        // 删除学校信息记录
        const [result] = await connection.execute('DELETE FROM school_info WHERE id = ?', [id]);
        
        await connection.commit();
        
        if (result.affectedRows === 0) {
            throw new Error('记录不存在或已被删除');
        }
        
        return { affectedRows: result.affectedRows };
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// 删除学校组合记录（按基准年份-测算年份-学校名称组合删除所有记录）
async function deleteSchoolCombination(schoolName, baseYear, year) {
    const pool = await getPool();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 只根据学校名称和测算年份删除记录，忽略基准年份参数
        const whereConditions = ['school_name = ?', 'year = ?'];
        const params = [schoolName, year];
        
        const whereClause = whereConditions.join(' AND ');
        
        // 首先获取要删除的记录ID，用于删除特殊补助
        const [recordsToDelete] = await connection.execute(
            `SELECT id FROM school_info WHERE ${whereClause}`,
            params
        );
        
        let totalDeletedCount = 0;
        
        // 删除特殊补助记录
        if (recordsToDelete.length > 0) {
            const recordIds = recordsToDelete.map(record => record.id);
            const placeholders = recordIds.map(() => '?').join(',');
            
            const [subsidiesResult] = await connection.execute(
                `DELETE FROM special_subsidies WHERE school_info_id IN (${placeholders})`,
                recordIds
            );
            
            console.log(`删除特殊补助记录: ${subsidiesResult.affectedRows} 条`);
        }
        
        // 删除学校信息记录
        const [result] = await connection.execute(
            `DELETE FROM school_info WHERE ${whereClause}`,
            params
        );
        
        totalDeletedCount = result.affectedRows;
        
        await connection.commit();
        
        console.log(`删除学校组合记录完成: 学校=${schoolName}, 基准年份=${baseYear}, 测算年份=${year}, 删除记录数=${totalDeletedCount}`);
        
        return { deletedCount: totalDeletedCount };
        
    } catch (error) {
        await connection.rollback();
        console.error('删除学校组合记录失败:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// 清空所有数据
async function clearAllData() {
    const pool = await getPool();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 先删除特殊补助表的数据
        await connection.execute('DELETE FROM special_subsidies');
        
        // 再删除学校信息表的数据
        await connection.execute('DELETE FROM school_info');
        
        // 重置自增ID
        await connection.execute('ALTER TABLE special_subsidies AUTO_INCREMENT = 1');
        await connection.execute('ALTER TABLE school_info AUTO_INCREMENT = 1');
        
        await connection.commit();
        
        return { message: '所有数据已清空' };
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// 根据ID获取学校记录
async function getSchoolRecordById(id) {
    const pool = await getPool();
    
    try {
        const [rows] = await pool.execute(`
            SELECT 
                si.*,
                GROUP_CONCAT(
                    CONCAT('{"特殊用房补助名称":"', ss.subsidy_name, '","补助面积（m²）":', ss.subsidy_area, '}')
                    SEPARATOR ','
                ) as special_subsidies_json
            FROM school_info si
            LEFT JOIN special_subsidies ss ON si.id = ss.school_info_id
            WHERE si.id = ?
            GROUP BY si.id
        `, [id]);
        
        if (rows.length === 0) {
            return null;
        }
        
        const result = {
            ...rows[0],
            special_subsidies: rows[0].special_subsidies_json ? 
                `[${rows[0].special_subsidies_json}]` : '[]'
        };
        
        return result;
        
    } catch (error) {
        console.error('获取学校记录失败:', error);
        throw error;
    }
}

module.exports = {
    saveSchoolInfo,
    getSchoolHistory,
    getLatestSchoolRecords,
    getAllSchoolRecords,
    getAvailableYears,
    getAvailableBaseYears,
    getSpecialSubsidies,
    getStatistics,
    deleteSchoolRecord,
    deleteSchoolCombination,
    clearAllData,
    getSchoolRecordById
};
