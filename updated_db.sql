-- ========================================
-- 学校面积测算系统数据库结构
-- 更新时间: 2025-08-25T15:18:45.217Z
-- ========================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS school_area_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE school_area_management;

-- ========================================
-- 表: basic_area_standards
-- ========================================
CREATE TABLE IF NOT EXISTS `basic_area_standards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '院校类型（A-J）',
  `room_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用房类型',
  `standard_value` decimal(8,2) NOT NULL COMMENT '标准值（平方米/人）',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '说明',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_school_room_type` (`school_type`,`room_type`),
  KEY `idx_basic_area_standards_school_type` (`school_type`),
  KEY `idx_basic_area_standards_room_type` (`room_type`)
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 当前记录数: 50

-- ========================================
-- 表: calculation_history
-- ========================================
CREATE TABLE IF NOT EXISTS `calculation_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_registry_id` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `student_stat_year` int DEFAULT NULL,
  `building_stat_year` int DEFAULT NULL,
  `submitter_username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '填报单位用户名',
  `base_year` int DEFAULT NULL,
  `full_time_undergraduate` int DEFAULT '0',
  `full_time_specialist` int DEFAULT '0',
  `full_time_master` int DEFAULT '0',
  `full_time_doctor` int DEFAULT '0',
  `international_undergraduate` int DEFAULT '0',
  `international_specialist` int DEFAULT '0',
  `international_master` int DEFAULT '0',
  `international_doctor` int DEFAULT '0',
  `total_students` int DEFAULT '0',
  `teaching_area` decimal(12,2) DEFAULT '0.00',
  `office_area` decimal(12,2) DEFAULT '0.00',
  `total_living_area` decimal(12,2) DEFAULT '0.00',
  `dormitory_area` decimal(12,2) DEFAULT '0.00',
  `logistics_area` decimal(12,2) DEFAULT '0.00',
  `current_building_area` decimal(12,2) DEFAULT '0.00',
  `required_building_area` decimal(12,2) DEFAULT '0.00',
  `teaching_area_gap` decimal(12,2) DEFAULT '0.00',
  `office_area_gap` decimal(12,2) DEFAULT '0.00',
  `dormitory_area_gap` decimal(12,2) DEFAULT '0.00',
  `other_living_area_gap` decimal(12,2) DEFAULT '0.00',
  `logistics_area_gap` decimal(12,2) DEFAULT '0.00',
  `total_area_gap_with_subsidy` decimal(12,2) DEFAULT '0.00' COMMENT '建筑面积总缺口（含特殊补助）',
  `total_area_gap_without_subsidy` decimal(12,2) DEFAULT '0.00' COMMENT '建筑面积总缺口（不含特殊补助）',
  `special_subsidy_total` decimal(12,2) DEFAULT '0.00',
  `calculation_results` longtext COLLATE utf8mb4_unicode_ci,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_school_info_name_year` (`year`),
  KEY `idx_school_info_year` (`year`),
  KEY `idx_school_registry_id` (`school_registry_id`)
) ENGINE=InnoDB AUTO_INCREMENT=375 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 当前记录数: 5

-- ========================================
-- 表: school_info_backup
-- ========================================
CREATE TABLE IF NOT EXISTS `school_info_backup` (
  `id` int NOT NULL DEFAULT '0',
  `school_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year` int DEFAULT NULL,
  `student_stat_year` int DEFAULT NULL,
  `building_stat_year` int DEFAULT NULL,
  `submitter_username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '填报单位用户名',
  `base_year` int DEFAULT NULL,
  `full_time_undergraduate` int DEFAULT '0',
  `full_time_specialist` int DEFAULT '0',
  `full_time_master` int DEFAULT '0',
  `full_time_doctor` int DEFAULT '0',
  `international_undergraduate` int DEFAULT '0',
  `international_specialist` int DEFAULT '0',
  `international_master` int DEFAULT '0',
  `international_doctor` int DEFAULT '0',
  `total_students` int DEFAULT '0',
  `teaching_area` decimal(12,2) DEFAULT '0.00',
  `office_area` decimal(12,2) DEFAULT '0.00',
  `total_living_area` decimal(12,2) DEFAULT '0.00',
  `dormitory_area` decimal(12,2) DEFAULT '0.00',
  `logistics_area` decimal(12,2) DEFAULT '0.00',
  `current_building_area` decimal(12,2) DEFAULT '0.00',
  `required_building_area` decimal(12,2) DEFAULT '0.00',
  `teaching_area_gap` decimal(12,2) DEFAULT '0.00',
  `office_area_gap` decimal(12,2) DEFAULT '0.00',
  `dormitory_area_gap` decimal(12,2) DEFAULT '0.00',
  `other_living_area_gap` decimal(12,2) DEFAULT '0.00',
  `logistics_area_gap` decimal(12,2) DEFAULT '0.00',
  `total_area_gap_with_subsidy` decimal(12,2) DEFAULT '0.00' COMMENT '建筑面积总缺口（含特殊补助）',
  `total_area_gap_without_subsidy` decimal(12,2) DEFAULT '0.00' COMMENT '建筑面积总缺口（不含特殊补助）',
  `special_subsidy_total` decimal(12,2) DEFAULT '0.00',
  `overall_compliance` tinyint(1) DEFAULT '0',
  `calculation_results` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 当前记录数: 15

-- ========================================
-- 视图: school_info_view
-- ========================================
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `school_info_view` AS select `ch`.`id` AS `id`,`sr`.`school_name` AS `school_name`,`sr`.`school_type` AS `school_type`,`ch`.`year` AS `year`,`ch`.`student_stat_year` AS `student_stat_year`,`ch`.`building_stat_year` AS `building_stat_year`,`ch`.`submitter_username` AS `submitter_username`,`ch`.`base_year` AS `base_year`,`ch`.`full_time_undergraduate` AS `full_time_undergraduate`,`ch`.`full_time_specialist` AS `full_time_specialist`,`ch`.`full_time_master` AS `full_time_master`,`ch`.`full_time_doctor` AS `full_time_doctor`,`ch`.`international_undergraduate` AS `international_undergraduate`,`ch`.`international_specialist` AS `international_specialist`,`ch`.`international_master` AS `international_master`,`ch`.`international_doctor` AS `international_doctor`,`ch`.`total_students` AS `total_students`,`ch`.`teaching_area` AS `teaching_area`,`ch`.`office_area` AS `office_area`,`ch`.`total_living_area` AS `total_living_area`,`ch`.`dormitory_area` AS `dormitory_area`,`ch`.`logistics_area` AS `logistics_area`,`ch`.`current_building_area` AS `current_building_area`,`ch`.`required_building_area` AS `required_building_area`,`ch`.`teaching_area_gap` AS `teaching_area_gap`,`ch`.`office_area_gap` AS `office_area_gap`,`ch`.`dormitory_area_gap` AS `dormitory_area_gap`,`ch`.`other_living_area_gap` AS `other_living_area_gap`,`ch`.`logistics_area_gap` AS `logistics_area_gap`,`ch`.`total_area_gap_with_subsidy` AS `total_area_gap_with_subsidy`,`ch`.`total_area_gap_without_subsidy` AS `total_area_gap_without_subsidy`,`ch`.`special_subsidy_total` AS `special_subsidy_total`,`ch`.`overall_compliance` AS `overall_compliance`,`ch`.`calculation_results` AS `calculation_results`,`ch`.`remarks` AS `remarks`,`ch`.`created_at` AS `created_at` from (`calculation_history` `ch` join `school_registry` `sr` on((`ch`.`school_registry_id` = `sr`.`id`)));

-- 记录数: 无法计算

-- ========================================
-- 表: school_registry
-- ========================================
CREATE TABLE IF NOT EXISTS `school_registry` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '学校名称',
  `school_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '学校类型',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `school_name` (`school_name`),
  KEY `idx_school_name` (`school_name`),
  KEY `idx_school_type` (`school_type`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学校基础信息注册表';

-- 当前记录数: 29

-- ========================================
-- 表: special_subsidies
-- ========================================
CREATE TABLE IF NOT EXISTS `special_subsidies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_info_id` int NOT NULL COMMENT '关联的计算历史记录ID（原school_info_id）',
  `subsidy_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subsidy_area` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_special_subsidies_school_id` (`school_info_id`),
  CONSTRAINT `special_subsidies_ibfk_1` FOREIGN KEY (`school_info_id`) REFERENCES `calculation_history` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=272 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 当前记录数: 10

-- ========================================
-- 表: subsidized_area_standards
-- ========================================
CREATE TABLE IF NOT EXISTS `subsidized_area_standards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '院校类型（综合院校、师范院校等）',
  `room_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用房类型（教学及辅助用房、办公用房、学生宿舍、其他生活用房、后勤辅助用房）',
  `subsidy_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '补贴类型（全日制硕士、全日制博士、留学生、留学生硕士、留学生博士）',
  `standard_value` decimal(8,2) NOT NULL COMMENT '标准值（平方米/人）',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '说明',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_school_room_subsidy` (`school_type`,`room_type`,`subsidy_type`)
) ENGINE=InnoDB AUTO_INCREMENT=451 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 当前记录数: 250

-- ========================================
-- 表: users
-- ========================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `real_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','construction_center','school') COLLATE utf8mb4_unicode_ci DEFAULT 'school',
  `school_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '学校用户对应的学校名称',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 当前记录数: 8

-- ========================================
-- 重要索引
-- ========================================
-- 表 basic_area_standards 的索引
-- CREATE INDEX idx_basic_area_standards_room_type ON basic_area_standards (room_type);
-- CREATE INDEX idx_basic_area_standards_school_type ON basic_area_standards (school_type);
-- CREATE UNIQUE INDEX uk_school_room_type ON basic_area_standards (school_type, room_type);

-- 表 calculation_history 的索引
-- CREATE INDEX idx_school_info_name_year ON calculation_history (year);
-- CREATE INDEX idx_school_info_year ON calculation_history (year);
-- CREATE INDEX idx_school_registry_id ON calculation_history (school_registry_id);

-- 表 school_registry 的索引
-- CREATE INDEX idx_school_name ON school_registry (school_name);
-- CREATE INDEX idx_school_type ON school_registry (school_type);
-- CREATE UNIQUE INDEX school_name ON school_registry (school_name);

-- 表 special_subsidies 的索引
-- CREATE INDEX idx_special_subsidies_school_id ON special_subsidies (school_info_id);

-- 表 subsidized_area_standards 的索引
-- CREATE UNIQUE INDEX unique_school_room_subsidy ON subsidized_area_standards (school_type, room_type, subsidy_type);

-- 表 users 的索引
-- CREATE UNIQUE INDEX username ON users (username);

-- ========================================
-- 外键约束
-- ========================================
-- ALTER TABLE special_subsidies ADD CONSTRAINT special_subsidies_ibfk_1 FOREIGN KEY (school_info_id) REFERENCES calculation_history(id);

-- ========================================
-- 数据库架构导出完成
-- ========================================
