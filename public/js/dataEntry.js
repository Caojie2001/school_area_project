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
// 年份选择器管理器 (重新实现)
// ========================================

const YearSelectorManager = {
    currentYearGridIndex: 0,
    currentStudentYearGridIndex: 0,
    currentBuildingYearGridIndex: 0,
    
    // 初始化事件监听器
    init() {
        // 添加遮罩层点击关闭功能
        document.addEventListener('click', (e) => {
            // 关闭通用年份选择器
            const yearOverlay = document.getElementById('yearGridOverlay');
            if (e.target === yearOverlay) {
                this.hideYearGrid();
            }
            
            // 关闭学生年份选择器
            const studentOverlay = document.getElementById('studentYearGridOverlay');
            if (e.target === studentOverlay) {
                this.hideStudentYearGrid();
            }
            
            // 关闭建筑年份选择器
            const buildingOverlay = document.getElementById('buildingYearGridOverlay');
            if (e.target === buildingOverlay) {
                this.hideBuildingYearGrid();
            }
        });
    },
    
    // 通用年份选择器
    showYearGrid() {
        const overlay = document.getElementById('yearGridOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            const yearInput = document.getElementById('year');
            const currentYear = new Date().getFullYear();
            const inputYear = parseInt(yearInput ? yearInput.value : currentYear) || currentYear;
            this.currentYearGridIndex = Math.floor((inputYear - (currentYear - 4)) / 9);
            this.updateYearGrid();
            document.addEventListener('keydown', this.handleYearGridKeyboard.bind(this));
        }
    },
    
    hideYearGrid() {
        const overlay = document.getElementById('yearGridOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.removeEventListener('keydown', this.handleYearGridKeyboard.bind(this));
        }
    },
    
    moveYearGrid(direction) {
        this.currentYearGridIndex += direction;
        this.updateYearGrid();
    },
    
    updateYearGrid() {
        const yearGrid = document.getElementById('yearGrid');
        const yearRangeText = document.getElementById('yearRangeText');
        const yearInput = document.getElementById('year');
        const currentYear = new Date().getFullYear();
        const inputYear = parseInt(yearInput ? yearInput.value : currentYear) || currentYear;
        
        if (!yearGrid || !yearRangeText) return;
        
        const baseYear = currentYear - 4 + (this.currentYearGridIndex * 9);
        const years = [];
        
        for (let i = 0; i < 9; i++) {
            years.push(baseYear + i);
        }
        
        yearRangeText.textContent = `${years[0]} - ${years[8]}`;
        
        yearGrid.innerHTML = '';
        years.forEach(year => {
            const yearItem = document.createElement('div');
            yearItem.className = 'year-item';
            yearItem.textContent = year;
            yearItem.onclick = () => this.selectYear(year);
            
            if (year === currentYear) {
                yearItem.classList.add('current');
            }
            
            if (year === inputYear) {
                yearItem.classList.add('selected');
            }
            
            yearGrid.appendChild(yearItem);
        });
    },
    
    selectYear(year) {
        const yearInput = document.getElementById('year');
        if (yearInput) {
            yearInput.value = year;
            const event = new Event('change', { bubbles: true });
            yearInput.dispatchEvent(event);
        }
        this.hideYearGrid();
    },
    
    handleYearGridKeyboard(e) {
        switch(e.key) {
            case 'Escape':
                this.hideYearGrid();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.moveYearGrid(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.moveYearGrid(1);
                break;
        }
    },
    
    // 学生年份选择器
    showStudentYearGrid() {
        const overlay = document.getElementById('studentYearGridOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            const yearInput = document.getElementById('student_stat_year');
            const currentYear = new Date().getFullYear();
            const inputYear = parseInt(yearInput ? yearInput.value : currentYear) || currentYear;
            this.currentStudentYearGridIndex = Math.floor((inputYear - (currentYear - 4)) / 9);
            this.updateStudentYearGrid();
            document.addEventListener('keydown', this.handleStudentYearGridKeyboard.bind(this));
        }
    },
    
    hideStudentYearGrid() {
        const overlay = document.getElementById('studentYearGridOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.removeEventListener('keydown', this.handleStudentYearGridKeyboard.bind(this));
        }
    },
    
    moveStudentYearGrid(direction) {
        this.currentStudentYearGridIndex += direction;
        this.updateStudentYearGrid();
    },
    
    updateStudentYearGrid() {
        const yearGrid = document.getElementById('studentYearGrid');
        const yearRangeText = document.getElementById('studentYearRangeText');
        const yearInput = document.getElementById('student_stat_year');
        const currentYear = new Date().getFullYear();
        const inputYear = parseInt(yearInput ? yearInput.value : currentYear) || currentYear;
        
        if (!yearGrid || !yearRangeText) return;
        
        const baseYear = currentYear - 4 + (this.currentStudentYearGridIndex * 9);
        const years = [];
        
        for (let i = 0; i < 9; i++) {
            years.push(baseYear + i);
        }
        
        yearRangeText.textContent = `${years[0]} - ${years[8]}`;
        
        yearGrid.innerHTML = '';
        years.forEach(year => {
            const yearItem = document.createElement('div');
            yearItem.className = 'year-item';
            yearItem.textContent = year;
            yearItem.onclick = () => this.selectStudentYear(year);
            
            if (year === currentYear) {
                yearItem.classList.add('current');
            }
            
            if (year === inputYear) {
                yearItem.classList.add('selected');
            }
            
            yearGrid.appendChild(yearItem);
        });
    },
    
    selectStudentYear(year) {
        const yearInput = document.getElementById('student_stat_year');
        if (yearInput) {
            yearInput.value = year;
            const event = new Event('change', { bubbles: true });
            yearInput.dispatchEvent(event);
        }
        this.hideStudentYearGrid();
    },
    
    handleStudentYearGridKeyboard(e) {
        switch(e.key) {
            case 'Escape':
                this.hideStudentYearGrid();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.moveStudentYearGrid(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.moveStudentYearGrid(1);
                break;
        }
    },
    
    // 建筑年份选择器
    showBuildingYearGrid() {
        const overlay = document.getElementById('buildingYearGridOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            const yearInput = document.getElementById('building_stat_year');
            const currentYear = new Date().getFullYear();
            const inputYear = parseInt(yearInput ? yearInput.value : currentYear) || currentYear;
            this.currentBuildingYearGridIndex = Math.floor((inputYear - (currentYear - 4)) / 9);
            this.updateBuildingYearGrid();
            document.addEventListener('keydown', this.handleBuildingYearGridKeyboard.bind(this));
        }
    },
    
    hideBuildingYearGrid() {
        const overlay = document.getElementById('buildingYearGridOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.removeEventListener('keydown', this.handleBuildingYearGridKeyboard.bind(this));
        }
    },
    
    moveBuildingYearGrid(direction) {
        this.currentBuildingYearGridIndex += direction;
        this.updateBuildingYearGrid();
    },
    
    updateBuildingYearGrid() {
        const yearGrid = document.getElementById('buildingYearGrid');
        const yearRangeText = document.getElementById('buildingYearRangeText');
        const yearInput = document.getElementById('building_stat_year');
        const currentYear = new Date().getFullYear();
        const inputYear = parseInt(yearInput ? yearInput.value : currentYear) || currentYear;
        
        if (!yearGrid || !yearRangeText) return;
        
        const baseYear = currentYear - 4 + (this.currentBuildingYearGridIndex * 9);
        const years = [];
        
        for (let i = 0; i < 9; i++) {
            years.push(baseYear + i);
        }
        
        yearRangeText.textContent = `${years[0]} - ${years[8]}`;
        
        yearGrid.innerHTML = '';
        years.forEach(year => {
            const yearItem = document.createElement('div');
            yearItem.className = 'year-item';
            yearItem.textContent = year;
            yearItem.onclick = () => this.selectBuildingYear(year);
            
            if (year === currentYear) {
                yearItem.classList.add('current');
            }
            
            if (year === inputYear) {
                yearItem.classList.add('selected');
            }
            
            yearGrid.appendChild(yearItem);
        });
    },
    
    selectBuildingYear(year) {
        const yearInput = document.getElementById('building_stat_year');
        if (yearInput) {
            yearInput.value = year;
            const event = new Event('change', { bubbles: true });
            yearInput.dispatchEvent(event);
        }
        this.hideBuildingYearGrid();
    },
    
    handleBuildingYearGridKeyboard(e) {
        switch(e.key) {
            case 'Escape':
                this.hideBuildingYearGrid();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.moveBuildingYearGrid(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.moveBuildingYearGrid(1);
                break;
        }
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
            
            // 初始化年份选择器
            YearSelectorManager.init();
            
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
        
        // 表单提交事件
        const form = document.getElementById('onlineDataForm');
        if (form) {
            // 移除可能存在的旧监听器
            form.removeEventListener('submit', this.handleFormSubmit);
            // 添加新的监听器
            form.addEventListener('submit', (event) => this.handleFormSubmit(event));
            console.log('表单提交事件监听器已绑定');
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
                schoolSelect.innerHTML = '<option value="">请选择高校</option>';
                
                // 添加学校选项
                response.schools.forEach(school => {
                    const option = document.createElement('option');
                    option.value = school.school_name;
                    option.textContent = school.school_name;
                    schoolSelect.appendChild(option);
                });
                
                console.log(`加载了 ${response.schools.length} 个学校选项`);
                
                // 检查当前用户是否为学校用户，如果是则自动设置学校名称
                this.handleSchoolUserAutoSelection();
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
     * 处理学校用户的自动选择
     */
    handleSchoolUserAutoSelection() {
        // 获取当前用户信息
        const currentUser = typeof AuthManager !== 'undefined' ? AuthManager.getCurrentUser() : null;
        
        if (currentUser && currentUser.role === 'school' && currentUser.school_name) {
            const schoolSelect = document.getElementById('schoolName');
            if (schoolSelect) {
                // 设置学校名称
                schoolSelect.value = currentUser.school_name;
                
                // 只有在还没有设置样式的情况下才设置（避免与auth.js重复）
                if (!schoolSelect.hasAttribute('data-locked')) {
                    schoolSelect.style.backgroundColor = '#f5f5f5';
                    schoolSelect.style.cursor = 'not-allowed';
                    schoolSelect.style.pointerEvents = 'none';
                    schoolSelect.setAttribute('data-locked', 'true');
                }
                
                console.log(`学校用户自动选择学校: ${currentUser.school_name}`);
                
                // 立即更新学校类型显示
                this.updateSchoolType();
            }
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
        const totalBuildingArea = teachingArea + officeArea + logisticsArea + totalLivingArea;
        
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
    },
    
    /**
     * 处理在线表单提交（从 script.js 迁移）
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            
            // 收集特殊补助数据
            const specialSubsidies = this.getSpecialSubsidiesData();
            
            // 构造数据对象
            const schoolData = this.formatOnlineSubmissionData(formData);
            
            // 显示进度
            if (typeof showProgress === 'function') showProgress();
            if (typeof updateProgress === 'function') updateProgress(20, '正在处理数据...');
            
            // 发送到服务器处理
            const response = await fetch('/online-calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    schoolData: schoolData,
                    specialSubsidies: specialSubsidies
                })
            });
            
            if (typeof updateProgress === 'function') updateProgress(60, '正在计算分析...');
            
            if (!response.ok) {
                throw new Error(`服务器错误: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (typeof updateProgress === 'function') updateProgress(100, '计算完成!');
            
            // 显示结果
            setTimeout(() => {
                if (typeof hideProgress === 'function') hideProgress();
                this.displayCalculationResult(result);
            }, 500);
            
        } catch (error) {
            console.error('计算失败:', error);
            if (typeof hideProgress === 'function') hideProgress();
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('计算失败: ' + error.message);
            } else {
                alert('计算失败: ' + error.message);
            }
        }
    },
    
    /**
     * 获取特殊补助数据
     */
    getSpecialSubsidiesData() {
        const specialSubsidies = [];
        const subsidyNames = document.querySelectorAll('input[name="subsidyName[]"]');
        const subsidyAreas = document.querySelectorAll('input[name="subsidyArea[]"]');
        
        for (let i = 0; i < subsidyNames.length; i++) {
            const name = subsidyNames[i] ? subsidyNames[i].value.trim() : '';
            const area = subsidyAreas[i] ? parseFloat(subsidyAreas[i].value) : 0;
            
            if (name && area > 0) {
                specialSubsidies.push({
                    '特殊用房补助名称': name,
                    '补助面积（m²）': parseFloat(area.toFixed(2))
                });
            }
        }
        
        return specialSubsidies;
    },
    
    /**
     * 格式化在线提交数据
     */
    formatOnlineSubmissionData(formData) {
        // 获取学校名称
        let finalSchoolName = formData.get('schoolName');
        if (!finalSchoolName) {
            const schoolNameSelect = document.getElementById('schoolName');
            if (schoolNameSelect) {
                finalSchoolName = schoolNameSelect.value;
            }
            // 如果还是没有，尝试从全局用户信息获取
            if (!finalSchoolName && typeof currentUser !== 'undefined' && currentUser && currentUser.school_name) {
                finalSchoolName = currentUser.school_name;
            }
        }
        
        // 获取学校类型
        const schoolTypeDisplay = document.getElementById('schoolTypeDisplay');
        const schoolTypeText = schoolTypeDisplay ? schoolTypeDisplay.textContent : '';
        const schoolType = schoolTypeText ? schoolTypeText.replace('学校类型: ', '') : null;
        
        // 兼容历史字段：优先用本科字段，无则用本专科字段
        let fullTimeUndergraduate = formData.get('fullTimeUndergraduate');
        let fullTimeSpecialist = formData.get('fullTimeSpecialist');
        let fullTimeBachelorAndSpecialist = formData.get('fullTimeBachelorAndSpecialist');

        let undergraduateVal = null;
        if (fullTimeUndergraduate !== null && fullTimeUndergraduate !== undefined && fullTimeUndergraduate !== "") {
            undergraduateVal = parseInt(fullTimeUndergraduate) || 0;
        } else if (fullTimeBachelorAndSpecialist !== null && fullTimeBachelorAndSpecialist !== undefined && fullTimeBachelorAndSpecialist !== "") {
            undergraduateVal = parseInt(fullTimeBachelorAndSpecialist) || 0;
        } else {
            undergraduateVal = 0;
        }

        let specialistVal = parseInt(fullTimeSpecialist) || 0;

        const schoolData = {
            '学校名称': finalSchoolName,
            '学校类型': schoolType,
            '年份': parseInt(formData.get('year')),
            '学生统计年份': parseInt(formData.get('student_stat_year')),
            '建筑面积统计年份': parseInt(formData.get('building_stat_year')),
            '全日制本科生人数': undergraduateVal,
            '全日制专科生人数': specialistVal,
            '全日制硕士生人数': parseInt(formData.get('fullTimeMaster')) || 0,
            '全日制博士生人数': parseInt(formData.get('fullTimeDoctor')) || 0,
            '留学生本科生人数': parseInt(formData.get('internationalUndergraduate')) || 0,
            '留学生专科生人数': parseInt(formData.get('internationalSpecialist')) || 0,
            '留学生硕士生人数': parseInt(formData.get('internationalMaster')) || 0,
            '留学生博士生人数': parseInt(formData.get('internationalDoctor')) || 0,
            '学生总人数': parseInt(document.getElementById('totalStudents').value.replace(/,/g, '')), // 移除千分符
            '现有教学及辅助用房面积': parseFloat(formData.get('teachingArea')),
            '现有办公用房面积': parseFloat(formData.get('officeArea')),
            '现有生活用房总面积': parseFloat(formData.get('totalLivingArea')),
            '现有学生宿舍面积': parseFloat(formData.get('dormitoryArea')),
            '现有后勤辅助用房面积': parseFloat(formData.get('logisticsArea')),
            '备注': formData.get('remarks') || ''
        };
        return schoolData;
    },
    
    /**
     * 显示计算结果
     */
    displayCalculationResult(result) {
        // 保存完整的结果数据供下载使用
        if (typeof window !== 'undefined') {
            window.globalAnalysisResult = result;
        }
        
        // 显示详细的分析结果
        if (typeof displayOnlineCalculationResult === 'function') {
            displayOnlineCalculationResult(result);
        } else if (typeof showAnalysisResults === 'function') {
            showAnalysisResults([result.schoolData]);
        }
        
        // 滚动到分析结果区域
        const analysisSection = document.getElementById('analysisResultsSection');
        if (analysisSection) {
            analysisSection.scrollIntoView({ behavior: 'smooth' });
        }
    },
    
    /**
     * 更新学校类型显示
     */
    updateSchoolType() {
        const schoolSelect = document.getElementById('schoolName');
        const schoolTypeDisplay = document.getElementById('schoolTypeDisplay');
        
        const schoolTypes = {
            '上海大学': '综合院校',
            '上海交通大学医学院': '医药院校',
            '上海理工大学': '理工院校',
            '上海师范大学': '师范院校',
            '上海科技大学': '理工院校',
            '华东政法大学': '政法院校',
            '上海海事大学': '理工院校',
            '上海海洋大学': '农业院校',
            '上海中医药大学': '医药院校',
            '上海体育大学': '体育院校',
            '上海音乐学院': '艺术院校',
            '上海戏剧学院': '艺术院校',
            '上海电力大学': '理工院校',
            '上海对外经贸大学': '财经院校',
            '上海应用技术大学': '理工院校',
            '上海立信会计金融学院': '财经院校',
            '上海工程技术大学': '理工院校',
            '上海第二工业大学': '理工院校',
            '上海商学院': '财经院校',
            '上海电机学院': '理工院校',
            '上海政法学院': '政法院校',
            '上海健康医学院': '医药院校',
            '上海出版印刷高等专科学校': '理工院校',
            '上海旅游高等专科学校': '其他',
            '上海城建职业学院': '理工院校',
            '上海电子信息职业技术学院': '理工院校',
            '上海工艺美术职业学院': '理工院校',
            '上海农林职业技术学院': '农业院校',
            '上海健康医学院附属卫生学校(上海健康护理职业学院(筹))': '医药院校'
        };
        
        if (schoolSelect && schoolTypeDisplay) {
            const selectedSchool = schoolSelect.value;
            if (selectedSchool && schoolTypes[selectedSchool]) {
                schoolTypeDisplay.textContent = `学校类型: ${schoolTypes[selectedSchool]}`;
            } else {
                schoolTypeDisplay.textContent = '';
            }
        }
    },
    
    /**
     * 特殊补助管理功能
     */
    addSubsidy() {
        const container = document.getElementById('specialSubsidies');
        if (!container) {
            console.error('找不到特殊补助容器');
            return;
        }
        
        // 如果是第一个补助项，添加表头
        if (container.children.length === 0) {
            const headerHtml = `
                <div class="subsidy-header" style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-weight: bold; color: #495057;">
                    <div style="flex: 2; margin-right: 15px;">补助名称</div>
                    <div style="flex: 1; margin-right: 15px;">补助建筑面积(m²)</div>
                    <div style="width: 80px;">操作</div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', headerHtml);
        }
        
        // 创建新的补助项
        const subsidyHtml = `
            <div class="subsidy-item" style="display: flex; align-items: center; margin-bottom: 10px; padding: 10px; background: white; border: 1px solid #e9ecef; border-radius: 5px;">
                <div style="flex: 2; margin-right: 15px;">
                    <input type="text" name="subsidyName[]" placeholder="例如：重点实验室补助" class="form-control" style="background: white; border: 1px solid #ddd; padding: 8px; border-radius: 4px; width: 100%;">
                </div>
                <div style="flex: 1; margin-right: 15px;">
                    <input type="number" name="subsidyArea[]" value="0.00" min="0" step="0.01" class="form-control" oninput="DataEntryManager.updateSubsidySummary()" onblur="formatSubsidyArea(this)" style="background: white; border: 1px solid #ddd; padding: 8px; border-radius: 4px; width: 100%;">
                </div>
                <div style="width: 80px;">
                    <button type="button" onclick="DataEntryManager.removeSubsidy(this)" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">删除</button>
                </div>
            </div>
        `;
        
        // 插入到汇总行之前
        const summaryRow = container.querySelector('.subsidy-summary');
        if (summaryRow) {
            summaryRow.insertAdjacentHTML('beforebegin', subsidyHtml);
        } else {
            container.insertAdjacentHTML('beforeend', subsidyHtml);
            // 添加汇总行
            this.addSubsidySummary();
        }
        
        this.updateSubsidySummary();
    },
    
    /**
     * 删除补助项
     */
    removeSubsidy(button) {
        const subsidyItem = button.closest('.subsidy-item');
        if (subsidyItem) {
            subsidyItem.remove();
            
            // 检查是否还有补助项（除了汇总行）
            const container = document.getElementById('specialSubsidies');
            const remainingItems = container.querySelectorAll('.subsidy-item:not(.subsidy-summary)');
            
            if (remainingItems.length === 0) {
                // 如果没有补助项了，清空整个容器（包括表头和汇总行）
                container.innerHTML = '';
            } else {
                this.updateSubsidySummary();
            }
        }
    },
    
    /**
     * 添加补助汇总行
     */
    addSubsidySummary() {
        const container = document.getElementById('specialSubsidies');
        if (!container || container.querySelector('.subsidy-summary')) return;
        
        const summaryHtml = `
            <div class="subsidy-summary subsidy-item" style="display: flex; align-items: center; margin-top: 15px; padding: 10px; background: transparent; border: none; border-radius: 5px; font-weight: bold;">
                <div style="flex: 2; margin-right: 15px;">
                    <div style="margin-bottom: 5px; color: #495057; font-size: 14px;">补助数量</div>
                    <input type="text" id="subsidyTotalCount" readonly class="form-control calculated-field" value="0" style="background: #f5f5f5; border: none; padding: 8px; border-radius: 4px; width: 100%; font-weight: bold; text-align: center;">
                </div>
                <div style="flex: 1; margin-right: 15px;">
                    <div style="margin-bottom: 5px; color: #495057; font-size: 14px;">补助建筑总面积(m²)</div>
                    <input type="text" id="subsidyTotalArea" readonly class="form-control calculated-field" value="0.00" style="background: #f5f5f5; border: none; padding: 8px; border-radius: 4px; width: 100%; font-weight: bold; text-align: center;">
                </div>
                <div style="width: 80px;"></div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', summaryHtml);
    },
    
    /**
     * 更新补助汇总
     */
    updateSubsidySummary() {
        const container = document.getElementById('specialSubsidies');
        if (!container) return;
        
        const subsidyInputs = container.querySelectorAll('input[name="subsidyArea[]"]');
        const nameInputs = container.querySelectorAll('input[name="subsidyName[]"]');
        let total = 0;
        let count = 0;
        
        subsidyInputs.forEach((input, index) => {
            const value = parseFloat(input.value) || 0;
            total += value;
            
            // 计算有效的补助项目数量（有名称的项目）
            if (nameInputs[index] && nameInputs[index].value.trim()) {
                count++;
            }
        });
        
        const totalInput = document.getElementById('subsidyTotalArea');
        if (totalInput) {
            totalInput.value = total.toFixed(2);
        }
        
        const countInput = document.getElementById('subsidyTotalCount');
        if (countInput) {
            countInput.value = count;
        }
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

/**
 * 处理在线表单提交（兼容性）
 */
function handleOnlineFormSubmit(event) {
    return DataEntryManager.handleFormSubmit(event);
}

/**
 * 特殊补助管理函数（兼容性）
 */
function addSubsidy() {
    return DataEntryManager.addSubsidy();
}

function removeSubsidy(button) {
    return DataEntryManager.removeSubsidy(button);
}

function updateSubsidySummary() {
    return DataEntryManager.updateSubsidySummary();
}

function formatSubsidyArea(input) {
    const value = parseFloat(input.value) || 0;
    input.value = (typeof formatToTwoDecimals === 'function') ? formatToTwoDecimals(value) : value.toFixed(2);
    // 触发汇总更新
    DataEntryManager.updateSubsidySummary();
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
    window.YearSelectorManager = YearSelectorManager;
    
    // 年份选择器函数 (向后兼容)
    window.showYearGrid = () => YearSelectorManager.showYearGrid();
    window.hideYearGrid = () => YearSelectorManager.hideYearGrid();
    window.moveYearGrid = (direction) => YearSelectorManager.moveYearGrid(direction);
    window.updateYearGrid = () => YearSelectorManager.updateYearGrid();
    window.selectYear = (year) => YearSelectorManager.selectYear(year);
    window.handleYearGridKeyboard = (event) => YearSelectorManager.handleYearGridKeyboard(event);
    
    window.showStudentYearGrid = () => YearSelectorManager.showStudentYearGrid();
    window.hideStudentYearGrid = () => YearSelectorManager.hideStudentYearGrid();
    window.moveStudentYearGrid = (direction) => YearSelectorManager.moveStudentYearGrid(direction);
    window.updateStudentYearGrid = () => YearSelectorManager.updateStudentYearGrid();
    window.selectStudentYear = (year) => YearSelectorManager.selectStudentYear(year);
    window.handleStudentYearGridKeyboard = (event) => YearSelectorManager.handleStudentYearGridKeyboard(event);
    
    window.showBuildingYearGrid = () => YearSelectorManager.showBuildingYearGrid();
    window.hideBuildingYearGrid = () => YearSelectorManager.hideBuildingYearGrid();
    window.moveBuildingYearGrid = (direction) => YearSelectorManager.moveBuildingYearGrid(direction);
    window.updateBuildingYearGrid = () => YearSelectorManager.updateBuildingYearGrid();
    window.selectBuildingYear = (year) => YearSelectorManager.selectBuildingYear(year);
    window.handleBuildingYearGridKeyboard = (event) => YearSelectorManager.handleBuildingYearGridKeyboard(event);
    
    // 兼容性函数
    window.initializeOnlineForm = initializeOnlineForm;
    window.calculateTotalStudents = calculateTotalStudents;
    window.calculateTotalBuildingArea = calculateTotalBuildingArea;
    window.calculateOtherLivingArea = calculateOtherLivingArea;
    window.submitOnlineData = submitOnlineData;
    window.updateSchoolType = updateSchoolType;
    window.handleOnlineFormSubmit = handleOnlineFormSubmit;
    
    // 特殊补助管理函数
    window.addSubsidy = addSubsidy;
    window.removeSubsidy = removeSubsidy;
    window.updateSubsidySummary = updateSubsidySummary;
    window.formatSubsidyArea = formatSubsidyArea;
    
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
