/**
 * ==============================================
 * dataEntry.js - 数据填报功能模块
 * ==============================================
 * 
 * 【文件职责】
 * - 数据填报表单的初始化和管理
 * - 学生数据和建筑面积的计算逻辑
 * - 表单验证和数据提交
 * - 学校信息的动态加载和更新
 * - 补助数据的计算和管理
 */

// ========================================
// 表单状态管理
// ========================================

const FormState = {
    LOADING: 'loading',
    READY: 'ready',
    CALCULATING: 'calculating',
    SUBMITTING: 'submitting'
};

// 当前表单状态
let currentFormState = FormState.READY;

// ========================================
// 计算标准常量
// ========================================

const CalculationStandards = {
    // 学生折算系数
    STUDENT_COEFFICIENTS: {
        specialist: 1.0,
        undergraduate: 1.0,
        master: 1.5,
        doctor: 2.0,
        international: 1.0
    },
    
    // 建筑面积标准 (平方米/人)
    BUILDING_STANDARDS: {
        teaching: 14,      // 教学用房标准
        office: 5,         // 行政办公用房标准
        logistics: 8,      // 后勤及辅助用房标准
        dormitory: 6.5,    // 宿舍标准
        living: 2.5        // 其他生活用房标准
    }
};

// ========================================
// 数据填报管理器
// ========================================

const DataEntryManager = {
    
    /**
     * 初始化数据填报模块
     */
    async initialize() {
        try {
            console.log('开始初始化数据填报模块...');
            
            // 初始化表单
            this.initializeForm();
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 加载学校选项
            await this.loadSchoolOptions();
            
            console.log('数据填报模块初始化完成');
            
        } catch (error) {
            console.error('数据填报模块初始化失败:', error);
        }
    },
    
    /**
     * 初始化表单
     */
    initializeForm() {
        // 重置表单状态
        currentFormState = FormState.READY;
        
        // 初始化计算
        this.calculateTotalStudents();
        this.calculateTotalBuildingArea();
        this.calculateOtherLivingArea();
    },
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 学校选择事件
        const schoolSelect = document.getElementById('schoolName');
        if (schoolSelect) {
            schoolSelect.addEventListener('change', () => this.updateSchoolType());
        }
        
        // 学生数据输入事件（已在HTML中通过oninput设置）
        // 建筑面积输入事件（已在HTML中通过oninput设置）
    },
    
    /**
     * 加载学校选项
     */
    async loadSchoolOptions() {
        const schoolSelect = document.getElementById('schoolName');
        if (!schoolSelect) return;
        
        try {
            currentFormState = FormState.LOADING;
            
            const response = await DataEntryAPI.getSchools();
            
            if (response.success && response.schools) {
                // 清空现有选项
                schoolSelect.innerHTML = '<option value="">请选择学校</option>';
                
                // 添加学校选项
                response.schools.forEach(school => {
                    const option = document.createElement('option');
                    option.value = school.school_name;
                    option.textContent = school.school_name;
                    schoolSelect.appendChild(option);
                });
                
                console.log(`加载了 ${response.schools.length} 个学校选项`);
            } else {
                console.warn('获取学校列表失败:', response.message);
            }
            
        } catch (error) {
            console.error('加载学校选项失败:', error);
        } finally {
            currentFormState = FormState.READY;
        }
    },
    
    /**
     * 更新学校类型显示
     */
    async updateSchoolType() {
        const schoolNameSelect = document.getElementById('schoolName');
        const schoolTypeDisplay = document.getElementById('schoolTypeDisplay');
        
        if (!schoolNameSelect || !schoolTypeDisplay) {
            return;
        }
        
        const selectedSchool = schoolNameSelect.value;
        if (!selectedSchool) {
            schoolTypeDisplay.textContent = '';
            return;
        }
        
        try {
            const data = await DataEntryAPI.getSchoolType(selectedSchool);
            
            if (data.success) {
                schoolTypeDisplay.textContent = `院校类别: ${data.schoolType}`;
            } else {
                schoolTypeDisplay.textContent = '院校类别: 未指定';
            }
        } catch (error) {
            console.error('获取学校类型失败:', error);
            schoolTypeDisplay.textContent = '院校类别: 获取失败';
        }
    },
    
    /**
     * 计算学生总数
     */
    calculateTotalStudents() {
        console.log('开始计算学生总数...');
        
        // 全日制学生
        const fullTimeSpecialistEl = document.getElementById('fullTimeSpecialist');
        const fullTimeUndergraduateEl = document.getElementById('fullTimeUndergraduate');
        const fullTimeMasterEl = document.getElementById('fullTimeMaster');
        const fullTimeDoctorEl = document.getElementById('fullTimeDoctor');
        
        const fullTimeSpecialist = parseInt(fullTimeSpecialistEl ? fullTimeSpecialistEl.value : 0) || 0;
        const fullTimeUndergraduate = parseInt(fullTimeUndergraduateEl ? fullTimeUndergraduateEl.value : 0) || 0;
        const fullTimeMaster = parseInt(fullTimeMasterEl ? fullTimeMasterEl.value : 0) || 0;
        const fullTimeDoctor = parseInt(fullTimeDoctorEl ? fullTimeDoctorEl.value : 0) || 0;
        
        const fullTimeTotal = fullTimeSpecialist + fullTimeUndergraduate + fullTimeMaster + fullTimeDoctor;
        
        // 留学生（不包括专科生）
        const internationalUndergraduateEl = document.getElementById('internationalUndergraduate');
        const internationalMasterEl = document.getElementById('internationalMaster');
        const internationalDoctorEl = document.getElementById('internationalDoctor');
        
        const internationalUndergraduate = parseInt(internationalUndergraduateEl ? internationalUndergraduateEl.value : 0) || 0;
        const internationalMaster = parseInt(internationalMasterEl ? internationalMasterEl.value : 0) || 0;
        const internationalDoctor = parseInt(internationalDoctorEl ? internationalDoctorEl.value : 0) || 0;
        
        const internationalTotal = internationalUndergraduate + internationalMaster + internationalDoctor;
        
        // 更新显示
        const fullTimeTotalEl = document.getElementById('fullTimeTotal');
        if (fullTimeTotalEl) {
            fullTimeTotalEl.value = fullTimeTotal;
            console.log('设置全日制总数:', fullTimeTotal);
        }
        
        const internationalTotalEl = document.getElementById('internationalTotal');
        if (internationalTotalEl) {
            internationalTotalEl.value = internationalTotal;
            console.log('设置留学生总数:', internationalTotal);
        }
        
        // 计算总学生数
        const totalStudents = fullTimeTotal + internationalTotal;
        const totalStudentsEl = document.getElementById('totalStudents');
        if (totalStudentsEl) {
            totalStudentsEl.value = totalStudents;
            console.log('设置学生总人数:', totalStudents);
        }
        
        console.log('计算完成:', { fullTimeTotal, internationalTotal, totalStudents });
        
        return {
            fullTimeTotal,
            internationalTotal,
            totalStudents,
            breakdown: {
                fullTimeSpecialist,
                fullTimeUndergraduate,
                fullTimeMaster,
                fullTimeDoctor,
                internationalUndergraduate,
                internationalMaster,
                internationalDoctor
            }
        };
    },
    
    /**
     * 计算建筑总面积
     */
    calculateTotalBuildingArea() {
        console.log('开始计算建筑总面积...');
        
        // 获取各类建筑面积输入值
        const teachingAreaEl = document.getElementById('teachingArea');
        const officeAreaEl = document.getElementById('officeArea');
        const logisticsAreaEl = document.getElementById('logisticsArea');
        const totalLivingAreaEl = document.getElementById('totalLivingArea');
        const dormitoryAreaEl = document.getElementById('dormitoryArea');
        
        const teachingArea = parseFloat(teachingAreaEl ? teachingAreaEl.value : 0) || 0;
        const officeArea = parseFloat(officeAreaEl ? officeAreaEl.value : 0) || 0;
        const logisticsArea = parseFloat(logisticsAreaEl ? logisticsAreaEl.value : 0) || 0;
        const totalLivingArea = parseFloat(totalLivingAreaEl ? totalLivingAreaEl.value : 0) || 0;
        const dormitoryArea = parseFloat(dormitoryAreaEl ? dormitoryAreaEl.value : 0) || 0;
        
        // 计算总建筑面积
        const totalBuildingArea = teachingArea + officeArea + logisticsArea + totalLivingArea + dormitoryArea;
        
        // 更新总面积显示
        const totalBuildingAreaEl = document.getElementById('totalBuildingArea');
        if (totalBuildingAreaEl) {
            totalBuildingAreaEl.value = totalBuildingArea.toFixed(2);
            console.log('设置建筑总面积:', totalBuildingArea);
        }
        
        console.log('建筑面积计算完成:', {
            teachingArea,
            officeArea,
            logisticsArea,
            totalLivingArea,
            dormitoryArea,
            totalBuildingArea
        });
        
        return {
            teachingArea,
            officeArea,
            logisticsArea,
            totalLivingArea,
            dormitoryArea,
            totalBuildingArea
        };
    },
    
    /**
     * 计算其他生活用房面积
     */
    calculateOtherLivingArea() {
        console.log('开始计算其他生活用房面积...');
        
        const totalLivingAreaEl = document.getElementById('totalLivingArea');
        const dormitoryAreaEl = document.getElementById('dormitoryArea');
        const otherLivingAreaEl = document.getElementById('otherLivingArea');
        
        const totalLivingArea = parseFloat(totalLivingAreaEl ? totalLivingAreaEl.value : 0) || 0;
        const dormitoryArea = parseFloat(dormitoryAreaEl ? dormitoryAreaEl.value : 0) || 0;
        
        // 其他生活用房 = 生活用房总面积 - 宿舍面积
        const otherLivingArea = Math.max(0, totalLivingArea - dormitoryArea);
        
        if (otherLivingAreaEl) {
            otherLivingAreaEl.value = otherLivingArea.toFixed(2);
            console.log('设置其他生活用房面积:', otherLivingArea);
        }
        
        return {
            totalLivingArea,
            dormitoryArea,
            otherLivingArea
        };
    },
    
    /**
     * 提交在线数据
     */
    async submitOnlineData() {
        if (currentFormState === FormState.SUBMITTING) {
            console.warn('数据正在提交中，请勿重复提交');
            return;
        }
        
        try {
            currentFormState = FormState.SUBMITTING;
            console.log('开始提交数据...');
            
            // 验证表单数据
            const validationResult = this.validateAllData();
            if (!validationResult.isValid) {
                showAlert('error', `数据验证失败: ${validationResult.errors.join(', ')}`);
                return;
            }
            
            // 收集表单数据
            const formData = this.formatSubmissionData();
            
            // 提交数据
            const response = await DataEntryAPI.submitData(formData);
            
            if (response.success) {
                showAlert('success', '数据提交成功！');
                console.log('数据提交成功:', response);
            } else {
                showAlert('error', `数据提交失败: ${response.message}`);
                console.error('数据提交失败:', response);
            }
            
        } catch (error) {
            console.error('提交数据时发生错误:', error);
            showAlert('error', '数据提交时发生错误，请稍后重试');
        } finally {
            currentFormState = FormState.READY;
        }
    },
    
    /**
     * 验证所有数据
     */
    validateAllData() {
        const errors = [];
        
        // 验证学校选择
        const schoolName = document.getElementById('schoolName')?.value;
        if (!schoolName) {
            errors.push('请选择学校');
        }
        
        // 验证学生数据
        const studentData = this.calculateTotalStudents();
        if (studentData.totalStudents <= 0) {
            errors.push('学生总数必须大于0');
        }
        
        // 验证建筑面积数据
        const buildingData = this.calculateTotalBuildingArea();
        if (buildingData.totalBuildingArea <= 0) {
            errors.push('建筑总面积必须大于0');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    /**
     * 格式化提交数据
     */
    formatSubmissionData() {
        const studentData = this.calculateTotalStudents();
        const buildingData = this.calculateTotalBuildingArea();
        const livingData = this.calculateOtherLivingArea();
        
        return {
            schoolName: document.getElementById('schoolName')?.value,
            year: new Date().getFullYear(),
            students: studentData,
            buildings: buildingData,
            living: livingData,
            submittedAt: new Date().toISOString(),
            submittedBy: AuthManager.getCurrentUser()?.username
        };
    },
    
    /**
     * 重置表单
     */
    resetForm() {
        // 重置所有输入字段
        const inputs = document.querySelectorAll('#page-data-entry input[type="number"]');
        inputs.forEach(input => {
            input.value = '0';
        });
        
        // 重置学校选择
        const schoolSelect = document.getElementById('schoolName');
        if (schoolSelect) {
            schoolSelect.value = '';
        }
        
        // 重新计算
        this.calculateTotalStudents();
        this.calculateTotalBuildingArea();
        this.calculateOtherLivingArea();
        
        console.log('表单已重置');
    }
};

// ========================================
// 兼容性函数（保持向后兼容）
// ========================================

/**
 * 初始化在线表单（兼容性）
 */
function initializeOnlineForm() {
    return DataEntryManager.initialize();
}

/**
 * 计算学生总数（兼容性）
 */
function calculateTotalStudents() {
    return DataEntryManager.calculateTotalStudents();
}

/**
 * 计算建筑总面积（兼容性）
 */
function calculateTotalBuildingArea() {
    return DataEntryManager.calculateTotalBuildingArea();
}

/**
 * 计算其他生活用房面积（兼容性）
 */
function calculateOtherLivingArea() {
    return DataEntryManager.calculateOtherLivingArea();
}

/**
 * 更新学校类型（兼容性）
 */
function updateSchoolType() {
    return DataEntryManager.updateSchoolType();
}

/**
 * 提交在线数据（兼容性）
 */
function submitOnlineData() {
    return DataEntryManager.submitOnlineData();
}

// ========================================
// 导出到全局作用域
// ========================================

if (typeof window !== 'undefined') {
    // 主管理器
    window.DataEntryManager = DataEntryManager;
    
    // 兼容性函数
    window.initializeOnlineForm = initializeOnlineForm;
    window.calculateTotalStudents = calculateTotalStudents;
    window.calculateTotalBuildingArea = calculateTotalBuildingArea;
    window.calculateOtherLivingArea = calculateOtherLivingArea;
    window.submitOnlineData = submitOnlineData;
    window.updateSchoolType = updateSchoolType;
    
    // 常量
    window.FormState = FormState;
    window.CalculationStandards = CalculationStandards;
}

// ========================================
// 模块信息
// ========================================

console.log('✅ 数据填报模块 (dataEntry.js) 已加载');
console.log('📦 提供功能: 学生计算、建筑面积计算、数据提交、表单管理');
console.log('🔗 依赖模块: api.js, utils.js, auth.js');
