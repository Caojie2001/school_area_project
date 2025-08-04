const { getPool } = require('./database');

// 保存学校信息（包含计算结果）
async function saveSchoolInfo(schoolData, specialSubsidies = [], calculationResults = null) {
    const pool = await getPool();
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 准备计算结果数据
        let calcData = {};
        if (calculationResults) {
            calcData = {
                current_building_area: calculationResults['现有建筑总面积'] || 0,
                required_building_area: calculationResults['应配建筑总面积'] || 0,
                teaching_area_gap: calculationResults['教学及辅助用房缺口(A)'] || 0,
                office_area_gap: calculationResults['办公用房缺口(B)'] || 0,
                dormitory_area_gap: calculationResults['学生宿舍缺口(C1)'] || 0,
                other_living_area_gap: calculationResults['其他生活用房缺口(C2)'] || 0,
                logistics_area_gap: calculationResults['后勤辅助用房缺口(D)'] || 0,
                total_area_gap: calculationResults['建筑面积总缺口（含特殊补助）'] || 0,
                special_subsidy_total: calculationResults['特殊补助总面积'] || 0,
                overall_compliance: calculationResults['整体达标情况'] === '达标' ? 1 : 0,
                calculation_results: JSON.stringify(calculationResults)
            };
        }
        
        const [schoolResult] = await connection.execute(`
            INSERT INTO school_info (
                school_name, school_type, year, full_time_undergraduate, full_time_specialist, 
                full_time_master, full_time_doctor, international_undergraduate, international_specialist,
                international_master, international_doctor, total_students, teaching_area, 
                office_area, total_living_area, dormitory_area, logistics_area, remarks,
                current_building_area, required_building_area, teaching_area_gap, office_area_gap,
                dormitory_area_gap, other_living_area_gap, logistics_area_gap, total_area_gap,
                special_subsidy_total, overall_compliance, calculation_results
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            schoolData['学校名称'],
            schoolData['学校类型'] || null,
            schoolData['年份'],
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
            calcData.office_area_gap || 0,
            calcData.dormitory_area_gap || 0,
            calcData.other_living_area_gap || 0,
            calcData.logistics_area_gap || 0,
            calcData.total_area_gap || 0,
            calcData.special_subsidy_total || 0,
            calcData.overall_compliance || 0,
            calcData.calculation_results || null
        ]);
        
        const schoolInfoId = schoolResult.insertId;
        
        // 插入特殊补助信息
        if (specialSubsidies && specialSubsidies.length > 0) {
            for (const subsidy of specialSubsidies) {
                await connection.execute(`
                    INSERT INTO special_subsidies (school_info_id, subsidy_name, subsidy_area)
                    VALUES (?, ?, ?)
                `, [
                    schoolInfoId,
                    subsidy['特殊用房补助名称'],
                    subsidy['补助面积（m²）']
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
// 获取所有学校历史数据，支持按年份筛选
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
                si.remarks,
                si.created_at
            FROM school_info si
        `;
        
        if (year) {
            query += ' WHERE si.year = @year';
            request.input('year', sql.Int, year);
        }
        
        query += ' ORDER BY si.created_at DESC';
        
        const result = await request.query(query);
        
        // 获取每个学校的特殊补助信息
        const schoolsWithSubsidies = await Promise.all(
            result.recordset.map(async (school) => {
                const subsidyRequest = new sql.Request(pool);
                const subsidies = await subsidyRequest
                    .input('school_info_id', sql.Int, school.id)
                    .query(`
                        SELECT subsidy_name, subsidy_area 
                        FROM special_subsidies 
                        WHERE school_info_id = @school_info_id
                    `);
                
                return {
                    ...school,
                    special_subsidies: subsidies.recordset
                };
            })
        );
        
        return schoolsWithSubsidies;
        
    } catch (error) {
        throw error;
    }
}

// 获取各校各年度的最新记录（每个学校每年只返回最新的一条记录）
async function getLatestSchoolRecords(year = null, schoolName = null) {
    const pool = await getPool();
    const request = new sql.Request(pool);
    
    try {
        let query = `
            WITH LatestRecords AS (
                SELECT 
                    si.id,
                    si.school_name,
                    si.school_type,
                    si.year,
                    si.full_time_undergraduate,
                    si.full_time_master,
                    si.full_time_doctor,
                    si.international_undergraduate,
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
                    ROW_NUMBER() OVER (PARTITION BY si.school_name, si.year ORDER BY si.created_at DESC) as rn
                FROM school_info si
                WHERE 1=1
        `;
        
        const conditions = [];
        if (year) {
            conditions.push('si.year = @year');
            request.input('year', sql.Int, year);
        }
        
        if (schoolName) {
            conditions.push('si.school_name = @schoolName');
            request.input('schoolName', sql.NVarChar(100), schoolName);
        }
        
        if (conditions.length > 0) {
            query = query.replace('WHERE 1=1', 'WHERE ' + conditions.join(' AND '));
        }
        
        query += `
            )
            SELECT * FROM LatestRecords 
            WHERE rn = 1
            ORDER BY created_at DESC
        `;
        
        const result = await request.query(query);
        
        // 获取每个学校的特殊补助信息
        const schoolsWithSubsidies = await Promise.all(
            result.recordset.map(async (school) => {
                const subsidyRequest = new sql.Request(pool);
                const subsidies = await subsidyRequest
                    .input('school_info_id', sql.Int, school.id)
                    .query(`
                        SELECT subsidy_name, subsidy_area 
                        FROM special_subsidies 
                        WHERE school_info_id = @school_info_id
                    `);
                
                return {
                    ...school,
                    special_subsidies: subsidies.recordset
                };
            })
        );
        
        return schoolsWithSubsidies;
        
    } catch (error) {
        throw error;
    }
}

// 获取所有可用年份
async function getAvailableYears() {
    const pool = await getPool();
    const request = new sql.Request(pool);
    
    try {
        const result = await request.query(`
            SELECT DISTINCT year 
            FROM school_info 
            WHERE year IS NOT NULL 
            ORDER BY year DESC
        `);
        
        return result.recordset.map(row => row.year);
        
    } catch (error) {
        throw error;
    }
}

// 获取特殊补助信息
async function getSpecialSubsidies(schoolInfoId) {
    const connection = await pool.getConnection();
    
    try {
        const [rows] = await connection.execute(`
            SELECT subsidy_name, subsidy_area
            FROM special_subsidies
            WHERE school_info_id = ?
            ORDER BY id
        `, [schoolInfoId]);
        
        return rows.map(row => ({
            '特殊用房补助名称': row.subsidy_name,
            '补助面积（m²）': row.subsidy_area
        }));
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}

// 获取统计数据，支持按年份筛选（只统计每个学校每年的最新记录，且过滤空记录）
async function getStatistics(year = null) {
    const pool = await getPool();
    const request = new sql.Request(pool);
    
    try {
        let whereClause = '';
        if (year) {
            whereClause = 'AND year = @year';
            request.input('year', sql.Int, year);
        }
        
        const result = await request.query(`
            WITH LatestRecords AS (
                SELECT 
                    school_name,
                    year,
                    total_students,
                    teaching_area,
                    ROW_NUMBER() OVER (PARTITION BY school_name, year ORDER BY created_at DESC) as rn
                FROM school_info
                WHERE total_students > 0 ${whereClause}
            )
            SELECT 
                COUNT(*) as total_schools,
                AVG(CAST(total_students as FLOAT)) as avg_students,
                AVG(CAST(teaching_area as FLOAT)) as avg_teaching_area,
                SUM(CAST(total_students as BIGINT)) as total_students_sum,
                SUM(CAST(teaching_area as FLOAT)) as total_teaching_area_sum
            FROM LatestRecords
            WHERE rn = 1
        `);
        
        return result.recordset[0];
        
    } catch (error) {
        throw error;
    }
}

// 删除学校记录
async function deleteSchoolRecord(id) {
    const pool = await getPool();
    
    try {
        // 首先检查记录是否存在
        const checkRequest = new sql.Request(pool);
        const existingRecord = await checkRequest
            .input('id', sql.Int, id)
            .query('SELECT id FROM school_info WHERE id = @id');
        
        if (existingRecord.recordset.length === 0) {
            throw new Error(`记录ID ${id} 不存在`);
        }
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        // 先删除相关的特殊补助记录
        const subsidyRequest = new sql.Request(transaction);
        const subsidyResult = await subsidyRequest
            .input('school_info_id', sql.Int, id)
            .query('DELETE FROM special_subsidies WHERE school_info_id = @school_info_id');
        
        console.log(`删除了 ${subsidyResult.rowsAffected[0]} 条特殊补助记录`);
        
        // 再删除学校记录
        const schoolRequest = new sql.Request(transaction);
        const schoolResult = await schoolRequest
            .input('id', sql.Int, id)
            .query('DELETE FROM school_info WHERE id = @id');
        
        if (schoolResult.rowsAffected[0] === 0) {
            await transaction.rollback();
            throw new Error(`删除记录ID ${id} 失败，记录可能已被其他操作删除`);
        }
        
        console.log(`成功删除学校记录ID: ${id}`);
        await transaction.commit();
        return true;
        
    } catch (error) {
        console.error('删除记录时发生错误:', error);
        throw error;
    }
}



// 清空所有数据
async function clearAllData() {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();
        
        // 先删除特殊补助表数据
        const subsidyRequest = new sql.Request(transaction);
        await subsidyRequest.query('DELETE FROM special_subsidies');
        
        // 再删除学校信息表数据
        const schoolRequest = new sql.Request(transaction);
        await schoolRequest.query('DELETE FROM school_info');
        
        await transaction.commit();
        console.log('所有数据已清空');
        return true;
        
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// 根据ID获取单条记录
async function getSchoolRecordById(id) {
    try {
        const request = new sql.Request();
        request.input('id', sql.Int, id);
        
        const query = `
            SELECT 
                id,
                school_name,
                year,
                school_type,
                full_time_undergraduate,
                full_time_master,
                full_time_doctor,
                international_undergraduate,
                international_master,
                international_doctor,
                total_students,
                teaching_area,
                office_area,
                total_living_area,
                dormitory_area,
                logistics_area,
                remarks,
                current_building_area,
                required_building_area,
                teaching_area_gap,
                office_area_gap,
                dormitory_area_gap,
                other_living_area_gap,
                logistics_area_gap,
                total_area_gap,
                special_subsidy_total,
                overall_compliance,
                calculation_results,
                created_at
            FROM school_info 
            WHERE id = @id
        `;
        
        const result = await request.query(query);
        return result.recordset[0] || null;
        
    } catch (error) {
        console.error('获取记录详情失败:', error);
        throw error;
    }
}

module.exports = {
    saveSchoolInfo,
    getSchoolHistory,
    getAvailableYears,
    getStatistics,
    deleteSchoolRecord,
    clearAllData,
    getLatestSchoolRecords,
    getSchoolRecordById
};
