-- 高校建筑面积缺口测算系统数据库初始化脚本
-- 使用说明：请手动执行此SQL文件来创建数据库和表结构
-- 执行命令：mysql -u root -p < db.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `school_area_management` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `school_area_management`;

-- 创建学校信息表
CREATE TABLE IF NOT EXISTS `school_info` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `school_name` VARCHAR(255) NOT NULL COMMENT '学校名称',
    `school_type` VARCHAR(50) COMMENT '院校类型',
    `year` INT COMMENT '测算年份',
    `student_stat_year` INT COMMENT '学生统计年份',
    `building_stat_year` INT COMMENT '建筑面积统计年份',
    `submitter_username` VARCHAR(50) NULL COMMENT '填报单位用户名',
    `full_time_undergraduate` INT DEFAULT 0 COMMENT '全日制本科生人数',
    `full_time_specialist` INT DEFAULT 0 COMMENT '全日制专科生人数',
    `full_time_master` INT DEFAULT 0 COMMENT '全日制硕士生人数',
    `full_time_doctor` INT DEFAULT 0 COMMENT '全日制博士生人数',
    `international_undergraduate` INT DEFAULT 0 COMMENT '留学生本科生人数',
    `international_specialist` INT DEFAULT 0 COMMENT '留学生专科生人数',
    `international_master` INT DEFAULT 0 COMMENT '留学生硕士生人数',
    `international_doctor` INT DEFAULT 0 COMMENT '留学生博士生人数',
    `total_students` INT DEFAULT 0 COMMENT '学生总人数',
    `teaching_area` DECIMAL(12,2) DEFAULT 0 COMMENT '教学及辅助用房面积',
    `office_area` DECIMAL(12,2) DEFAULT 0 COMMENT '办公用房面积',
    `total_living_area` DECIMAL(12,2) DEFAULT 0 COMMENT '生活用房总面积',
    `dormitory_area` DECIMAL(12,2) DEFAULT 0 COMMENT '学生宿舍面积',
    `logistics_area` DECIMAL(12,2) DEFAULT 0 COMMENT '后勤辅助用房面积',
    `current_building_area` DECIMAL(12,2) DEFAULT 0 COMMENT '现状建筑总面积',
    `required_building_area` DECIMAL(12,2) DEFAULT 0 COMMENT '应配建筑总面积',
    `teaching_area_gap` DECIMAL(12,2) DEFAULT 0 COMMENT '教学及辅助用房缺口',
    `office_area_gap` DECIMAL(12,2) DEFAULT 0 COMMENT '办公用房缺口',
    `dormitory_area_gap` DECIMAL(12,2) DEFAULT 0 COMMENT '学生宿舍缺口',
    `other_living_area_gap` DECIMAL(12,2) DEFAULT 0 COMMENT '其他生活用房缺口',
    `logistics_area_gap` DECIMAL(12,2) DEFAULT 0 COMMENT '后勤辅助用房缺口',
    `total_area_gap_with_subsidy` DECIMAL(12,2) DEFAULT 0 COMMENT '建筑面积总缺口（含特殊补助）',
    `total_area_gap_without_subsidy` DECIMAL(12,2) DEFAULT 0 COMMENT '建筑面积总缺口（不含特殊补助）',
    `special_subsidy_total` DECIMAL(12,2) DEFAULT 0 COMMENT '特殊补助总面积',
    `overall_compliance` BOOLEAN DEFAULT FALSE COMMENT '整体达标情况',
    `calculation_results` LONGTEXT COMMENT '计算结果详情（JSON格式）',
    `remarks` TEXT COMMENT '备注',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建特殊补助表
CREATE TABLE IF NOT EXISTS `special_subsidies` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `school_info_id` INT NOT NULL COMMENT '关联的学校信息ID',
    `subsidy_name` VARCHAR(200) NOT NULL COMMENT '补助名称',
    `subsidy_area` DECIMAL(12,2) NOT NULL COMMENT '补助面积',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (`school_info_id`) REFERENCES `school_info`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码（加密后）',
    `real_name` VARCHAR(100) COMMENT '真实姓名',
    `email` VARCHAR(100) COMMENT '邮箱',
    `role` ENUM('admin', 'construction_center', 'school') DEFAULT 'school' COMMENT '用户角色',
    `school_name` VARCHAR(200) NULL COMMENT '学校用户对应的学校名称',
    `status` ENUM('active', 'inactive') DEFAULT 'active' COMMENT '用户状态',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `last_login` TIMESTAMP NULL COMMENT '最后登录时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建索引以提高查询性能
CREATE INDEX `idx_school_info_name_year` ON `school_info`(`school_name`, `year`);
CREATE INDEX `idx_school_info_year` ON `school_info`(`year`);
CREATE INDEX `idx_special_subsidies_school_id` ON `special_subsidies`(`school_info_id`);
CREATE INDEX `idx_users_username` ON `users`(`username`);
CREATE INDEX `idx_users_role` ON `users`(`role`);

-- 创建默认管理员账户
-- 密码: admin123 (请在生产环境中修改)
INSERT IGNORE INTO `users` (`username`, `password`, `real_name`, `role`) 
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin');
