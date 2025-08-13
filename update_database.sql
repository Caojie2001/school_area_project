-- 数据库结构更新脚本
-- 将基准年份字段替换为学生统计年份和建筑面积统计年份

USE school_area_db;

-- 添加新字段：学生统计年份和建筑面积统计年份
ALTER TABLE school_info ADD COLUMN student_stat_year INT AFTER year;
ALTER TABLE school_info ADD COLUMN building_stat_year INT AFTER student_stat_year;

-- 如果有现有数据，将 base_year 的值迁移到新字段
UPDATE school_info 
SET student_stat_year = COALESCE(base_year, year),
    building_stat_year = COALESCE(base_year, year)
WHERE student_stat_year IS NULL OR building_stat_year IS NULL;

-- 如果没有base_year字段的数据，使用年份填充
UPDATE school_info 
SET student_stat_year = year,
    building_stat_year = year
WHERE student_stat_year IS NULL OR building_stat_year IS NULL;

-- 删除旧的base_year字段（可选，如果你想保留历史数据可以注释掉这行）
-- ALTER TABLE school_info DROP COLUMN base_year;

-- 确保新字段不为空
ALTER TABLE school_info MODIFY student_stat_year INT NOT NULL;
ALTER TABLE school_info MODIFY building_stat_year INT NOT NULL;

-- 验证更新结果
SELECT 
    school_name,
    year,
    student_stat_year,
    building_stat_year,
    base_year
FROM school_info 
LIMIT 10;
