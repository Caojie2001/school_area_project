/**
 * ==============================================
 * dataManagement.js - 数据管理功能模块
 * ==============================================
 * 
 * 【文件职责】
 * - 历史测算数据的查询和管理
 * - 数据列表的显示和表格同步
 * - 数据详情的展示和格式化
 * - 数据的编辑和删除操作
 * - 数据导出和批量操作功能
 */

// ========================================
// 全局变量
// ========================================

// 全局变量存储完整的分析结果，用于下载功能
let globalAnalysisResult = null;

// ========================================
// 状态管理
// ========================================

const DataManagementState = {
    LOADING: 'loading',
    LOADED: 'loaded',
    FILTERING: 'filtering',
    EXPORTING: 'exporting'
};

// 数据管理器
const DataManagementManager = {
    // 当前数据状态
    currentState: DataManagementState.LOADED,
    
    // 存储所有学校数据
    allDataSchoolsData: [],
    
    /**
     * 初始化数据管理模块
     */
    async initialize() {
        try {
            console.log('开始初始化数据管理模块...');
            
            // 初始化时隐藏汇总栏
            const summarySection = document.getElementById('dataSummarySection');
            if (summarySection) {
                summarySection.style.display = 'none';
            }
            
            await this.loadDataAvailableYears();
            await this.loadDataAvailableUsers();
            await this.loadSchoolOptions();
            
            // 如果是学校用户，自动锁定学校筛选器和用户筛选器
            if (currentUser && currentUser.role === 'school') {
                this.lockSchoolUserFilters();
            }
            
            // 自动搜索加载所有数据
            setTimeout(() => {
                this.searchDataRecords();
            }, 100);
            
            console.log('数据管理模块初始化完成');
            
        } catch (error) {
            console.error('数据管理模块初始化失败:', error);
        }
    },
    
    /**
     * 锁定学校用户的筛选器
     */
    lockSchoolUserFilters() {
        if (!currentUser || currentUser.role !== 'school') return;
        
        // 锁定学校筛选器
        const schoolFilter = document.getElementById('dataSchoolNameFilter');
        if (schoolFilter && currentUser.school_name) {
            // 检查是否存在对应的学校选项
            let schoolOptionExists = false;
            for (let i = 0; i < schoolFilter.options.length; i++) {
                if (schoolFilter.options[i].value === currentUser.school_name) {
                    schoolOptionExists = true;
                    break;
                }
            }
            
            // 如果不存在，添加学校选项
            if (!schoolOptionExists) {
                const option = document.createElement('option');
                option.value = currentUser.school_name;
                option.textContent = currentUser.school_name;
                schoolFilter.appendChild(option);
            }
            
            // 设置选中当前学校
            schoolFilter.value = currentUser.school_name;
            // 禁用筛选器，防止学校用户修改
            schoolFilter.disabled = true;
            // 添加样式提示这是被锁定的
            schoolFilter.style.backgroundColor = '#f5f5f5';
            schoolFilter.style.cursor = 'not-allowed';
        }
        
        // 锁定用户筛选器
        const userFilter = document.getElementById('dataUserFilter');
        if (userFilter) {
            // 设置选中当前用户（使用真实姓名）
            userFilter.value = currentUser.real_name || currentUser.username;
            // 禁用筛选器，防止学校用户修改
            userFilter.disabled = true;
            // 添加样式提示这是被锁定的
            userFilter.style.backgroundColor = '#f5f5f5';
            userFilter.style.cursor = 'not-allowed';
        }
    },
    
    /**
     * 搜索数据记录
     */
    async searchDataRecords() {
        const yearFilter = document.getElementById('dataYearFilter');
        const schoolFilter = document.getElementById('dataSchoolNameFilter');
        const userFilter = document.getElementById('dataUserFilter');
        const year = yearFilter ? yearFilter.value : 'all';
        const school = schoolFilter ? schoolFilter.value : 'all';
        const user = userFilter ? userFilter.value : 'all';
        
        console.log('开始搜索数据记录，筛选条件:', { year, school, user });
        
        const resultsContainer = document.getElementById('dataHistoryResults');
        const batchDownloadBtn = document.getElementById('batchDownloadBtn');
        resultsContainer.innerHTML = '<div class="loading">正在搜索...</div>';
        
        // 搜索时隐藏汇总栏
        const summarySection = document.getElementById('dataSummarySection');
        if (summarySection) {
            summarySection.style.display = 'none';
        }
        
        // 禁用批量下载按钮
        if (batchDownloadBtn) {
            batchDownloadBtn.disabled = true;
        }
        
        try {
            const result = await DataManagementAPI.searchSchoolsLatest({
                year: year,
                school: school,
                user: user
            });
            
            console.log('搜索API响应:', result);
            
            if (result.success) {
                this.allDataSchoolsData = result.data;
                console.log('搜索成功，加载了', result.data.length, '条记录');
                console.log('记录ID列表:', result.data.map(r => r.id));
                this.displayDataSchoolsResults(result.data);
                
                // 如果有搜索结果，启用批量下载按钮
                if (batchDownloadBtn && result.data.length > 0) {
                    batchDownloadBtn.disabled = false;
                }
            } else {
                console.error('搜索失败:', result.error);
                this.showDataError('搜索失败: ' + result.error);
            }
        } catch (error) {
            console.error('搜索失败:', error);
            this.showDataError('搜索失败: ' + error.message);
        }
    },
    
    /**
     * 加载可用年份
     */
    async loadDataAvailableYears() {
        try {
            const result = await CommonAPI.getYears();
            
            if (result.success) {
                const yearSelect = document.getElementById('dataYearFilter');
                if (yearSelect) {
                    yearSelect.innerHTML = '<option value="all">所有测算年份</option>';
                    
                    result.data.forEach(year => {
                        const option = document.createElement('option');
                        option.value = year;
                        option.textContent = year + '年';
                        yearSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('加载年份失败:', error);
        }
    },
    
    /**
     * 加载学校选项
     */
    async loadSchoolOptions() {
        try {
            const result = await DataEntryAPI.getSchools();
            
            if (result.success && result.schools) {
                const schoolSelect = document.getElementById('dataSchoolNameFilter');
                if (schoolSelect) {
                    // 保留第一个"所有学校"选项
                    schoolSelect.innerHTML = '<option value="all">所有学校</option>';
                    
                    result.schools.forEach(school => {
                        const option = document.createElement('option');
                        option.value = school.school_name;
                        option.textContent = school.school_name;
                        schoolSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('加载学校选项失败:', error);
        }
    },
    
    /**
     * 加载可用的测算用户
     */
    async loadDataAvailableUsers() {
        try {
            const result = await CommonAPI.getUsers();
            
            if (result.success) {
                const userSelect = document.getElementById('dataUserFilter');
                if (userSelect) {
                    userSelect.innerHTML = '<option value="all">所有测算用户</option>';
                    
                    result.data.forEach(user => {
                        const option = document.createElement('option');
                        // 使用真实姓名作为value进行筛选
                        option.value = user.real_name || user.username || user;
                        // 只显示真实姓名，不显示用户名
                        option.textContent = user.real_name || user.username || user;
                        userSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('加载测算用户失败:', error);
        }
    },
    
    /**
     * 清空筛选
     */
    clearDataFilter() {
        document.getElementById('dataYearFilter').value = 'all';
        document.getElementById('dataSchoolNameFilter').value = 'all';
        document.getElementById('dataUserFilter').value = 'all';
        
        // 清空结果显示
        const resultsContainer = document.getElementById('dataHistoryResults');
        resultsContainer.innerHTML = '<div class="alert alert-info">请选择筛选条件并点击查找按钮</div>';
        
        // 清空数据
        this.allDataSchoolsData = [];
        
        // 禁用批量下载按钮
        const batchDownloadBtn = document.getElementById('batchDownloadBtn');
        if (batchDownloadBtn) {
            batchDownloadBtn.disabled = true;
        }
    },
    
    /**
     * 显示数据错误
     */
    showDataError(message) {
        const container = document.getElementById('dataHistoryResults');
        container.innerHTML = `<div class="alert alert-danger">${message}</div>`;
        
        // 隐藏汇总栏
        const summarySection = document.getElementById('dataSummarySection');
        if (summarySection) {
            summarySection.style.display = 'none';
        }
    },
    
    /**
     * 显示数据搜索结果
     */
    displayDataSchoolsResults(schoolsData) {
        const container = document.getElementById('dataHistoryResults');
        
        if (!schoolsData || schoolsData.length === 0) {
            container.innerHTML = '<div class="alert alert-info">没有找到相关数据</div>';
            // 隐藏汇总栏
            const summarySection = document.getElementById('dataSummarySection');
            if (summarySection) {
                summarySection.style.display = 'none';
            }
            return;
        }
        
        // 计算并显示汇总信息
        this.updateDataSummary(schoolsData);
        
        let html = '<div class="table-container">';
        html += '<div class="data-table-wrapper">';
        
        // 左侧冻结列
        html += '<div class="frozen-left-columns">';
        html += '<table class="data-table-frozen-left"><thead><tr>';
        html += '<th>测算年份</th>';
        html += '<th>学校名称</th>';
        html += '</tr></thead><tbody>';
        
        schoolsData.forEach(school => {
            html += `<tr>
                <td><strong>${school.year || '未知'}</strong></td>
                <td><strong>${school.school_name || '未知'}</strong></td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        
        // 中间滚动数据列
        html += '<div class="scrollable-middle-columns" style="margin-left: 280px; margin-right: 250px; overflow-x: auto; overflow-y: hidden;">';
        html += '<table class="data-table-scrollable"><thead><tr>';
        html += '<th>现状建筑总面积(m²)</th>';
        html += '<th>学生规模测算建筑总面积(m²)</th>';
        html += '<th>学生规模测算建筑面积总缺额(不含补助)(m²)</th>';
        html += '<th>补助建筑总面积(m²)</th>';
        html += '<th>学生规模测算建筑面积总缺额(含补助)(m²)</th>';
        html += '<th>测算时间</th>';
        html += '<th>测算用户</th>';
        html += '</tr></thead><tbody>';
        
        schoolsData.forEach(school => {
            const date = new Date(school.created_at).toLocaleDateString('zh-CN');
            const time = new Date(school.created_at).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
            
            // 计算不含补助的缺口
            const gapWithoutSubsidy = school.total_area_gap_without_subsidy ? parseFloat(school.total_area_gap_without_subsidy) : ((school.total_area_gap_with_subsidy || 0) - (school.special_subsidy_total || 0));
            
            html += `<tr>
                <td>${school.current_building_area || '0.00'}</td>
                <td>${school.required_building_area || '0.00'}</td>
                <td>${gapWithoutSubsidy.toFixed ? gapWithoutSubsidy.toFixed(2) : '0.00'}</td>
                <td>${school.special_subsidy_total || '0.00'}</td>
                <td>${school.total_area_gap_with_subsidy || '0.00'}</td>
                <td>${date} ${time}</td>
                <td>${school.submitter_real_name || school.submitter_username || '未知用户'}</td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        
        // 右侧冻结操作列
        html += '<div class="frozen-right-columns">';
        html += '<table class="data-table-frozen-right"><thead><tr>';
        html += '<th>操作</th>';
        html += '</tr></thead><tbody>';
        
        schoolsData.forEach(school => {
            html += `<tr>
                <td>
                    <button style="background: none; color: #3498db; border: none; padding: 4px 8px; cursor: pointer; margin-right: 8px; font-size: 12px; text-decoration: underline;" onclick="viewDataSchoolDetails(${school.id})" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">详情</button>
                    <button style="background: none; color: #3498db; border: none; padding: 4px 8px; cursor: pointer; margin-right: 8px; font-size: 12px; text-decoration: underline;" onclick="downloadRecord(${school.id})" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">下载</button>
                    <button style="background: none; color: #f39c12; border: none; padding: 4px 8px; cursor: pointer; margin-right: 8px; font-size: 12px; text-decoration: underline;" onclick="editDataRecord(${school.id})" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">编辑</button>
                    <button style="background: none; color: #e74c3c; border: none; padding: 4px 8px; cursor: pointer; font-size: 12px; text-decoration: underline;" onclick="deleteSchoolCombination('${school.school_name}', '${school.year}', '${school.submitter_username || ''}')" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">删除</button>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        html += '</div>'; // data-table-wrapper
        html += '</div>'; // table-container
        
        html += `<div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #3498db;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
                <strong>共找到 ${schoolsData.length} 条记录</strong> | 
                可以使用上方的"批量下载"按钮下载所有搜索结果
            </p>
        </div>`;
        container.innerHTML = html;
        
        // 同步表格行高度和滚动 - 使用更好的时机
        requestAnimationFrame(() => {
            this.syncTableRows();
            this.syncTableScroll();
            
            // 再次确保同步，处理可能的渲染延迟
            setTimeout(() => {
                this.syncTableRows();
            }, 100);
        });
    },
    
    /**
     * 更新数据摘要信息
     */
    updateDataSummary(data) {
        const summaryText = document.getElementById('dataSummaryText');
        if (summaryText && data && data.length > 0) {
            const recordCount = data.length;
            const schoolCount = new Set(data.map(item => item.school_name)).size;
            const userCount = new Set(data.map(item => item.username)).size;
            
            summaryText.textContent = `共找到 ${recordCount} 条记录，涉及 ${schoolCount} 所学校，${userCount} 位用户`;
        } else if (summaryText) {
            summaryText.textContent = '没有找到相关数据';
        }
    },
    
    /**
     * 同步表格行高度
     */
    syncTableRows() {
        const leftRows = document.querySelectorAll('.data-table-frozen-left tbody tr');
        const middleRows = document.querySelectorAll('.data-table-scrollable tbody tr');
        const rightRows = document.querySelectorAll('.data-table-frozen-right tbody tr');
        
        if (leftRows.length === middleRows.length && middleRows.length === rightRows.length) {
            for (let i = 0; i < leftRows.length; i++) {
                // 强制设置统一的行高
                const fixedHeight = '42px';
                
                leftRows[i].style.height = fixedHeight;
                middleRows[i].style.height = fixedHeight;
                rightRows[i].style.height = fixedHeight;
                
                // 同时设置每个单元格的高度
                const leftCells = leftRows[i].querySelectorAll('td, th');
                const middleCells = middleRows[i].querySelectorAll('td, th');
                const rightCells = rightRows[i].querySelectorAll('td, th');
                
                leftCells.forEach(cell => cell.style.height = fixedHeight);
                middleCells.forEach(cell => cell.style.height = fixedHeight);
                rightCells.forEach(cell => cell.style.height = fixedHeight);
            }
        }
    },
    
    /**
     * 改进的表格滚动同步函数
     */
    syncTableScroll() {
        const leftTable = document.querySelector('.frozen-left-columns');
        const middleTable = document.querySelector('.scrollable-middle-columns');
        const rightTable = document.querySelector('.frozen-right-columns');
        
        if (!leftTable || !middleTable || !rightTable) return;
        
        let isScrolling = false;
        
        function syncVerticalScroll(source, targets) {
            if (isScrolling) return;
            isScrolling = true;
            
            targets.forEach(target => {
                target.scrollTop = source.scrollTop;
            });
            
            requestAnimationFrame(() => {
                isScrolling = false;
            });
        }
        
        // 监听中间表格滚动，同步到左右表格
        middleTable.addEventListener('scroll', () => {
            syncVerticalScroll(middleTable, [leftTable, rightTable]);
        });
        
        // 强制同步容器高度
        function syncContainerHeights() {
            const leftHeight = leftTable.scrollHeight;
            const middleHeight = middleTable.scrollHeight;
            const rightHeight = rightTable.scrollHeight;
            
            const maxHeight = Math.max(leftHeight, middleHeight, rightHeight);
            
            // 设置相同的滚动区域高度
            if (maxHeight > 600) {
                leftTable.style.height = '600px';
                rightTable.style.height = '600px';
            } else {
                leftTable.style.height = maxHeight + 'px';
                rightTable.style.height = maxHeight + 'px';
            }
        }
        
        // 初始同步和定期检查
        syncContainerHeights();
        const syncInterval = setInterval(() => {
            if (document.querySelector('.data-table-wrapper')) {
                syncContainerHeights();
                this.syncTableRows();
            } else {
                clearInterval(syncInterval);
            }
        }, 100); // 更频繁的检查
    },
    
    /**
     * 格式化院校类型显示
     */
    formatSchoolType(schoolType) {
        if (!schoolType) return '';
        
        let cleanType = schoolType.toString().trim();
        
        // 移除可能存在的前缀
        if (cleanType.includes('院校类别：')) {
            cleanType = cleanType.replace('院校类别：', '').trim();
        }
        if (cleanType.includes('院校类别: ')) {
            cleanType = cleanType.replace('院校类别: ', '').trim();
        }
        if (cleanType.includes('院校类型：')) {
            cleanType = cleanType.replace('院校类型：', '').trim();
        }
        if (cleanType.includes('院校类型: ')) {
            cleanType = cleanType.replace('院校类型: ', '').trim();
        }
        
        return cleanType;
    },
    
    /**
     * 查看学校详情
     */
    viewDataSchoolDetails(schoolId) {
        const school = this.allDataSchoolsData.find(s => s.id === schoolId);
        if (!school) {
            showMessage('找不到学校详情', 'error');
            return;
        }
        
        // 解析计算结果JSON
        let calculationResults = {};
        if (school.calculation_results) {
            try {
                calculationResults = JSON.parse(school.calculation_results);
            } catch (e) {
                console.error('解析计算结果失败:', e);
            }
        }
        
        // 解析特殊补助数据
        let specialSubsidies = [];
        if (school.special_subsidies) {
            try {
                specialSubsidies = JSON.parse(school.special_subsidies);
            } catch (e) {
                console.error('解析特殊补助数据失败:', e);
            }
        }
        
        // 计算不含补助的缺口
        const gapWithoutSubsidy = school.total_area_gap_without_subsidy ? 
            parseFloat(school.total_area_gap_without_subsidy) : 
            ((school.total_area_gap_with_subsidy || 0) - (school.special_subsidy_total || 0));
        
        // 创建与Excel第一个sheet完全一致的表格
        let detailsHtml = `
            <div style="max-width: 900px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #2c3e50; margin: 0;">记录详情</h2>
                    <button onclick="closeDetailsModal()" style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">关闭</button>
                </div>
                
                <!-- Excel表格样式 -->
                <div style="border: 1px solid #000; background: white;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <tr>
                            <td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background: #f0f0f0;">高校测算</td>
                        </tr>
                        <tr>
                            <td colspan="4" style="border: 1px solid #000; padding: 6px; background: #f8f8f8;">基本办学条件缺口（"－"表示超额，"+"表示缺额）</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="border: 1px solid #000; padding: 6px;"></td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">测算时间：${new Date(school.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-')}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">测算年份</td>
                            <td style="border: 1px solid #000; padding: 6px;">${school.year}</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">测算用户</td>
                            <td style="border: 1px solid #000; padding: 6px;">${school.submitter_real_name || school.submitter_username}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">学生统计年份</td>
                            <td style="border: 1px solid #000; padding: 6px;">${school.student_stat_year || school.year}</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">建筑面积统计年份</td>
                            <td style="border: 1px solid #000; padding: 6px;">${school.building_stat_year || school.year}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">单位/学校(机构)名称(章)</td>
                            <td style="border: 1px solid #000; padding: 6px;">${school.school_name}</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">院校类型</td>
                            <td style="border: 1px solid #000; padding: 6px;">${this.formatSchoolType(school.school_type)}</td>
                        </tr>
                        <tr>
                            <td colspan="4" style="border: 1px solid #000; padding: 6px;"></td>
                        </tr>
                        <tr>
                            <td colspan="4" style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #f8f8f8;">规划学生数</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px;">专科全日制学生数(人)</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${school.full_time_specialist || 0}</td>
                            <td style="border: 1px solid #000; padding: 6px;">本科全日制学生数(人)</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${school.full_time_undergraduate || 0}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px;">硕士全日制学生数(人)</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${school.full_time_master || 0}</td>
                            <td style="border: 1px solid #000; padding: 6px;">博士全日制学生数(人)</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${school.full_time_doctor || 0}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px;">本科留学生数(人)</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${school.international_undergraduate || 0}</td>
                            <td style="border: 1px solid #000; padding: 6px;">硕士留学生数(人)</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${school.international_master || 0}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px;">博士留学生(人)</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${school.international_doctor || 0}</td>
                            <td style="border: 1px solid #000; padding: 6px;"></td>
                            <td style="border: 1px solid #000; padding: 6px;"></td>
                        </tr>
                        <tr>
                            <td colspan="4" style="border: 1px solid #000; padding: 6px;"></td>
                        </tr>
                        <tr>
                            <td colspan="4" style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #f8f8f8;">测算结果</td>
                        </tr>
                        <tr style="font-weight: bold; background: #f0f0f0;">
                            <td style="border: 1px solid #000; padding: 6px;">用房类型</td>
                            <td style="border: 1px solid #000; padding: 6px;">现状建筑面积(m²)</td>
                            <td style="border: 1px solid #000; padding: 6px;">学生规模测算建筑面积(m²)</td>
                            <td style="border: 1px solid #000; padding: 6px;">学生规模测算建筑面积缺额(m²)</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px;">教学及辅助用房</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.teaching_area || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(calculationResults['总应配教学及辅助用房(A)'] || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.teaching_area_gap || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px;">办公用房</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.office_area || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(calculationResults['总应配办公用房(B)'] || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.office_area_gap || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px;">生活配套用房</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.total_living_area || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${(parseFloat(calculationResults['总应配学生宿舍(C1)'] || 0) + parseFloat(calculationResults['总应配其他生活用房(C2)'] || 0)).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${(parseFloat(school.dormitory_area_gap || 0) + parseFloat(school.other_living_area_gap || 0)).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px;">其中:学生宿舍</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.dormitory_area || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(calculationResults['总应配学生宿舍(C1)'] || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.dormitory_area_gap || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px;">其中:其他生活用房</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat((school.total_living_area || 0) - (school.dormitory_area || 0)).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(calculationResults['总应配其他生活用房(C2)'] || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.other_living_area_gap || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px;">后勤补助用房</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.logistics_area || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(calculationResults['总应配后勤辅助用房(D)'] || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.logistics_area_gap || 0).toFixed(2)}</td>
                        </tr>
                        <tr style="font-weight: bold; background: #f0f0f0;">
                            <td style="border: 1px solid #000; padding: 6px;">小计</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.current_building_area || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(school.required_building_area || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(gapWithoutSubsidy || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="border: 1px solid #000; padding: 6px; font-weight: bold;">学生规模测算建筑面积总缺额（不含补助）(m²)</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${parseFloat(gapWithoutSubsidy || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="border: 1px solid #000; padding: 6px; font-weight: bold;">补助建筑总面积(m²)</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${parseFloat(school.special_subsidy_total || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="border: 1px solid #000; padding: 6px; font-weight: bold;">学生规模测算建筑面积总缺额（含补助）(m²)</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${parseFloat(school.total_area_gap_with_subsidy || 0).toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
        `;
        
        // 如果有特殊补助，显示补助明细
        if (specialSubsidies && specialSubsidies.length > 0) {
            detailsHtml += `
                <div style="margin-top: 20px; border: 1px solid #000;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <tr>
                            <td colspan="2" style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background: #f0f0f0;">特殊补助明细</td>
                        </tr>
                        <tr style="font-weight: bold; background: #f8f8f8;">
                            <td style="border: 1px solid #000; padding: 6px;">补助名称</td>
                            <td style="border: 1px solid #000; padding: 6px;">补助面积(㎡)</td>
                        </tr>
            `;
            
            specialSubsidies.forEach(subsidy => {
                detailsHtml += `
                    <tr>
                        <td style="border: 1px solid #000; padding: 6px;">${subsidy['特殊用房补助名称'] || subsidy.name || '未命名项目'}</td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: right;">${parseFloat(subsidy['补助面积（m²）'] || subsidy.area || 0).toFixed(2)}</td>
                    </tr>
                `;
            });
            
            detailsHtml += `
                    </table>
                </div>
            `;
        }
        
        detailsHtml += `
            </div>
        `;
        
        // 创建模态框显示详情
        this.showDetailsModal(detailsHtml);
    },
    
    /**
     * 显示详情模态框
     */
    showDetailsModal(content) {
        // 先移除已存在的模态框
        this.closeDetailsModal();
        
        const modal = document.createElement('div');
        modal.id = 'detailsModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            overflow-y: auto;
            padding: 20px 0;
        `;
        modal.innerHTML = content;
        document.body.appendChild(modal);
        
        // 点击背景关闭模态框
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDetailsModal();
            }
        });
    },
    
    /**
     * 关闭详情模态框
     */
    closeDetailsModal() {
        const modal = document.getElementById('detailsModal');
        if (modal) {
            modal.remove();
        }
    },
    
    /**
     * 编辑记录
     */
    editDataRecord(recordId) {
        const school = this.allDataSchoolsData.find(s => s.id === recordId);
        if (!school) {
            showMessage('找不到记录数据', 'error');
            return;
        }
        
        // 切换到数据填报页面
        if (typeof showPage === 'function') {
            showPage('data-entry');
        }
        
        // 等待页面切换完成后填充数据
        setTimeout(() => {
            this.fillFormWithData(school);
        }, 100);
        
        console.log('编辑记录:', school);
    },

    /**
     * 将历史数据填充到表单中
     */
    fillFormWithData(school) {
        try {
            console.log('开始填充表单数据，完整数据:', school);
            
            // 等待表单完全加载
            setTimeout(() => {
                // 基本信息 - 学校名称
                const schoolNameEl = document.getElementById('schoolName');
                if (schoolNameEl && school.school_name) {
                    console.log('设置学校名称:', school.school_name);
                    schoolNameEl.value = school.school_name;
                    console.log('学校名称设置后的值:', schoolNameEl.value);
                }
                
                // 测算年份
                const yearEl = document.getElementById('year');
                if (yearEl) {
                    const year = school.year || school.student_stat_year || 2025;
                    yearEl.value = year;
                    console.log('设置年份:', year);
                }
                
                // 学生统计年份和建筑面积统计年份
                const studentStatYearEl = document.getElementById('student_stat_year');
                if (studentStatYearEl) {
                    studentStatYearEl.value = school.student_stat_year || school.year || 2025;
                }
                
                const buildingStatYearEl = document.getElementById('building_stat_year');
                if (buildingStatYearEl) {
                    buildingStatYearEl.value = school.building_stat_year || school.year || 2025;
                }
                
                // 学生人数信息 - 检查实际字段名
                console.log('填充学生数据...');
                this.fillStudentData(school);
                
                // 建筑面积信息
                console.log('填充建筑面积数据...');
                this.fillBuildingAreaData(school);
                
                // 备注
                const remarksEl = document.getElementById('remarks');
                if (remarksEl) remarksEl.value = school.remarks || '';
                
                // 延迟触发更新和计算
                setTimeout(() => {
                    this.triggerFormUpdates();
                    this.fillSpecialSubsidies(school);
                }, 300);
                
                // 滚动到页面顶部
                window.scrollTo(0, 0);
                showMessage('数据已成功加载到表单', 'success');
                
            }, 200);
            
        } catch (error) {
            console.error('填充表单数据失败:', error);
            showMessage('填充表单数据失败: ' + error.message, 'error');
        }
    },

    /**
     * 填充学生数据
     */
    fillStudentData(school) {
        // 检查所有可能的字段名
        const studentFields = [
            { id: 'fullTimeUndergraduate', keys: ['fulltime_undergrad', 'full_time_undergraduate', 'fulltime_undergraduate', 'fullTimeUndergraduate'] },
            { id: 'fullTimeSpecialist', keys: ['fulltime_specialist', 'full_time_specialist', 'fulltime_specialist'] },
            { id: 'fullTimeMaster', keys: ['fulltime_master', 'full_time_master', 'fulltime_master'] },
            { id: 'fullTimeDoctor', keys: ['fulltime_doctor', 'full_time_doctor', 'fulltime_doctor'] },
            { id: 'internationalUndergraduate', keys: ['international_undergraduate', 'international_undergrad'] },
            { id: 'internationalMaster', keys: ['international_master'] },
            { id: 'internationalDoctor', keys: ['international_doctor'] }
        ];

        studentFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                let value = 0;
                // 尝试多个可能的字段名
                for (const key of field.keys) {
                    if (school[key] !== undefined && school[key] !== null) {
                        value = school[key];
                        break;
                    }
                }
                element.value = value;
                console.log(`设置 ${field.id} = ${value}`);
            }
        });
    },

    /**
     * 填充建筑面积数据
     */
    fillBuildingAreaData(school) {
        const areaFields = [
            { id: 'teachingArea', keys: ['teaching_area', 'existing_teaching_area'] },
            { id: 'officeArea', keys: ['office_area', 'existing_office_area'] },
            { id: 'totalLivingArea', keys: ['total_living_area', 'existing_living_area'] },
            { id: 'dormitoryArea', keys: ['dormitory_area', 'existing_dormitory_area'] },
            { id: 'logisticsArea', keys: ['logistics_area', 'existing_logistics_area'] }
        ];

        areaFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                let value = 0;
                // 尝试多个可能的字段名
                for (const key of field.keys) {
                    if (school[key] !== undefined && school[key] !== null) {
                        value = school[key];
                        break;
                    }
                }
                element.value = value;
                console.log(`设置 ${field.id} = ${value}`);
            }
        });
    },

    /**
     * 触发表单更新和计算
     */
    triggerFormUpdates() {
        console.log('触发表单更新...');
        
        // 触发学校类型更新
        const schoolNameEl = document.getElementById('schoolName');
        if (schoolNameEl) {
            // 手动触发change事件
            const changeEvent = new Event('change', { bubbles: true });
            schoolNameEl.dispatchEvent(changeEvent);
            
            // 直接调用函数（如果存在）
            if (window.updateSchoolType) {
                window.updateSchoolType();
            }
        }

        // 触发计算函数
        setTimeout(() => {
            if (window.calculateTotalStudents) {
                window.calculateTotalStudents();
            }
            if (window.calculateOtherLivingArea) {
                window.calculateOtherLivingArea();
            }
            if (window.calculateTotalBuildingArea) {
                window.calculateTotalBuildingArea();
            }
        }, 100);
    },

    /**
     * 填充特殊补助信息
     */
    fillSpecialSubsidies(school) {
        if (!school.special_subsidies) return;
        
        console.log('开始填充特殊补助，原始数据:', school.special_subsidies);
        
        let subsidiesData = [];
        
        // 尝试解析特殊补助数据
        try {
            if (typeof school.special_subsidies === 'string') {
                subsidiesData = JSON.parse(school.special_subsidies);
            } else if (Array.isArray(school.special_subsidies)) {
                subsidiesData = school.special_subsidies;
            }
            
            console.log('解析后的特殊补助数据:', subsidiesData);
            
            if (subsidiesData && subsidiesData.length > 0) {
                // 先清空现有的特殊补助
                const subsidiesContainer = document.getElementById('specialSubsidies');
                if (subsidiesContainer) {
                    console.log('清空现有特殊补助容器');
                    subsidiesContainer.innerHTML = '';
                }
                
                // 添加历史的特殊补助项
                this.addSubsidiesRecursively(subsidiesData, 0);
            }
            
        } catch (error) {
            console.error('解析特殊补助数据失败:', error);
        }
    },

    /**
     * 递归添加特殊补助项
     */
    addSubsidiesRecursively(subsidiesData, index) {
        if (index >= subsidiesData.length) {
            // 所有补助项都处理完成，更新汇总
            console.log('所有特殊补助项处理完成，更新汇总');
            if (typeof updateSubsidySummary === 'function') {
                updateSubsidySummary();
            }
            return;
        }
        
        const subsidy = subsidiesData[index];
        console.log(`处理第${index + 1}个特殊补助项:`, subsidy);
        
        if (typeof addSubsidy === 'function') {
            addSubsidy();
            
            // 等待DOM更新后填充数据
            setTimeout(() => {
                const subsidyItems = document.querySelectorAll('.subsidy-item:not(.subsidy-summary)');
                
                if (subsidyItems.length > 0) {
                    const lastItem = subsidyItems[subsidyItems.length - 1];
                    
                    // 填充名称
                    const nameInput = lastItem.querySelector('input[name="subsidyName[]"]') || 
                                     lastItem.querySelector('input[placeholder*="重点实验室"]') ||
                                     lastItem.querySelector('input[type="text"]:not([readonly])');
                    
                    if (nameInput) {
                        nameInput.value = subsidy['特殊用房补助名称'] || subsidy.name || '';
                    }
                    
                    // 填充面积
                    const areaInput = lastItem.querySelector('input[name="subsidyArea[]"]') || 
                                     lastItem.querySelector('input[type="number"]:not([readonly])');
                    
                    if (areaInput) {
                        areaInput.value = subsidy['补助面积（m²）'] || subsidy.area || 0;
                    }
                    
                    console.log(`成功填充第${index + 1}个特殊补助项`);
                }
                
                // 继续处理下一个
                setTimeout(() => {
                    this.addSubsidiesRecursively(subsidiesData, index + 1);
                }, 300);
                
            }, 300);
        } else {
            console.warn('addSubsidy 函数不存在，跳过特殊补助填充');
        }
    },
    
    /**
     * 删除学校组合记录
     */
    async deleteSchoolCombination(schoolName, year, submitterUsername) {
        // 处理参数
        if (!schoolName || !year) {
            console.error('删除参数不完整:', { schoolName, year, submitterUsername });
            alert('删除失败：学校名称和年份不能为空');
            return;
        }
        
        // 处理空的submitterUsername
        if (!submitterUsername || submitterUsername === '未知用户' || submitterUsername === '') {
            submitterUsername = null;
        }
        
        const confirmMessage = `确定要删除"${schoolName} - ${year}年测算${submitterUsername ? ` - 测算用户:${submitterUsername}` : ''}"的所有记录吗？\n\n此操作将删除该组合的所有历史记录，不可恢复。`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        console.log('开始删除学校组合记录:', { schoolName, year, submitterUsername });
        
        try {
            const result = await DataManagementAPI.deleteSchoolCombination({
                schoolName: schoolName,
                year: year,
                submitterUsername: submitterUsername
            });
            
            console.log('删除API响应:', result);
            
            if (result.success) {
                console.log(`删除成功！共删除了 ${result.deletedCount} 条记录`);
                
                // 清空当前显示的数据
                this.allDataSchoolsData = [];
                
                // 立即显示加载状态
                const resultsContainer = document.getElementById('dataHistoryResults');
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="loading">正在刷新数据列表...</div>';
                }
                
                // 延迟一点时间再刷新，确保数据库操作完成
                setTimeout(() => {
                    console.log('执行数据刷新...');
                    this.searchDataRecords().then(() => {
                        console.log('数据刷新完成');
                    }).catch(err => {
                        console.error('刷新数据失败:', err);
                        alert('刷新数据失败，请手动点击"查找"按钮重新加载。');
                    });
                }, 1000);
            } else {
                console.error('删除失败:', result.error);
                this.showDataError('删除失败: ' + result.error);
            }
        } catch (error) {
            console.error('删除失败:', error);
            this.showDataError('删除失败: ' + error.message);
        }
    }
};

// 创建全局实例
const dataManagementManager = DataManagementManager;

// 全局函数兼容层（在从 index.html 迁移时使用）
function loadDataManagementContent() {
    return dataManagementManager.initialize();
}

function searchDataRecords() {
    return dataManagementManager.searchDataRecords();
}

function loadDataAvailableYears() {
    return dataManagementManager.loadDataAvailableYears();
}

function loadDataAvailableUsers() {
    return dataManagementManager.loadDataAvailableUsers();
}

function clearDataFilter() {
    return dataManagementManager.clearDataFilter();
}

function showDataError(message) {
    return dataManagementManager.showDataError(message);
}

function displayDataSchoolsResults(schoolsData) {
    return dataManagementManager.displayDataSchoolsResults(schoolsData);
}

function updateDataSummary(data) {
    return dataManagementManager.updateDataSummary(data);
}

function syncTableRows() {
    return dataManagementManager.syncTableRows();
}

function syncTableScroll() {
    return dataManagementManager.syncTableScroll();
}

function viewDataSchoolDetails(schoolId) {
    return dataManagementManager.viewDataSchoolDetails(schoolId);
}

function editDataRecord(recordId) {
    return dataManagementManager.editDataRecord(recordId);
}

function deleteSchoolCombination(schoolName, year, submitterUsername) {
    return dataManagementManager.deleteSchoolCombination(schoolName, year, submitterUsername);
}

// 将对象添加到全局作用域，以便其他模块使用
if (typeof window !== 'undefined') {
    window.DataManagementManager = DataManagementManager;
    window.dataManagementManager = dataManagementManager;
    
    // 全局变量兼容性 - 使用代理保持引用
    Object.defineProperty(window, 'allDataSchoolsData', {
        get: () => dataManagementManager.allDataSchoolsData,
        set: (value) => { dataManagementManager.allDataSchoolsData = value; }
    });
    
    // 全局函数
    window.loadDataManagementContent = loadDataManagementContent;
    window.searchDataRecords = searchDataRecords;
    window.loadDataAvailableYears = loadDataAvailableYears;
    window.loadDataAvailableUsers = loadDataAvailableUsers;
    window.clearDataFilter = clearDataFilter;
    window.showDataError = showDataError;
    window.displayDataSchoolsResults = displayDataSchoolsResults;
    window.updateDataSummary = updateDataSummary;
    window.syncTableRows = syncTableRows;
    window.syncTableScroll = syncTableScroll;
    window.viewDataSchoolDetails = viewDataSchoolDetails;
    window.editDataRecord = editDataRecord;
    window.deleteSchoolCombination = deleteSchoolCombination;
    window.closeDetailsModal = () => dataManagementManager.closeDetailsModal();

    // 单条记录下载
    window.downloadRecord = async function(recordId) {
        try {
            if (!recordId) {
                showMessage('无效的记录ID', 'error');
                return;
            }
            
            showMessage('开始下载...', 'info');
            
            // 调用API获取下载数据
            const result = await CommonAPI.downloadRecord(recordId);
            
            if (result && result.success) {
                if (result.downloadUrl) {
                    // 如果返回的是下载链接，直接触发下载
                    const a = document.createElement('a');
                    a.href = result.downloadUrl;
                    a.download = '';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else if (result.fileData && result.fileName) {
                    // 如果返回的是base64数据，创建blob并下载
                    const byteCharacters = atob(result.fileData);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { 
                        type: result.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                    });
                    
                    // 创建下载链接
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = result.fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                } else {
                    showMessage('下载失败，服务器返回数据格式错误', 'error');
                    return;
                }
                
                showMessage('下载成功', 'success');
            } else {
                showMessage(result && result.error ? result.error : '下载失败，未获取到文件数据', 'error');
            }
        } catch (err) {
            console.error('下载失败:', err);
            showMessage('下载失败: ' + (err.message || err), 'error');
        }
    };

    // 批量下载搜索结果
    window.batchDownloadSearchResults = async function() {
        const yearFilter = document.getElementById('dataYearFilter');
        const schoolFilter = document.getElementById('dataSchoolNameFilter');
        const userFilter = document.getElementById('dataUserFilter');
        const batchDownloadBtn = document.getElementById('batchDownloadBtn');
        
        const year = yearFilter ? yearFilter.value : 'all';
        const school = schoolFilter ? schoolFilter.value : 'all';
        const user = userFilter ? userFilter.value : 'all';
        
        if (!dataManagementManager.allDataSchoolsData || dataManagementManager.allDataSchoolsData.length === 0) {
            showMessage('没有可下载的数据，请先进行搜索', 'error');
            return;
        }
        
        try {
            // 显示加载状态
            const originalText = batchDownloadBtn.textContent;
            batchDownloadBtn.disabled = true;
            batchDownloadBtn.textContent = '下载中...';
            
            // 构建请求参数
            const requestBody = {
                exportType: 'filtered'
            };
            
            if (year !== 'all') {
                requestBody.year = year;
            }
            if (school !== 'all') {
                requestBody.school = school;
            }
            if (user !== 'all') {
                requestBody.user = user;
            }
            
            console.log('批量下载请求参数:', requestBody);
            
            // 发送批量导出请求
            const result = await CommonAPI.batchExport(requestBody);
            
            if (!result.success) {
                throw new Error(result.error || '批量下载失败');
            }
            
            // 成功后自动下载文件
            if (result.success) {
                // 直接触发下载
                window.location.href = result.downloadUrl;
                
                // 显示成功消息
                showMessage(`批量下载成功！共下载 ${result.recordCount} 条记录`, 'info');
            } else {
                throw new Error(result.error || '批量下载失败');
            }
            
        } catch (error) {
            console.error('批量下载失败:', error);
            showMessage('批量下载失败: ' + error.message, 'error');
        } finally {
            // 恢复按钮状态
            batchDownloadBtn.disabled = false;
            batchDownloadBtn.textContent = '批量下载';
        }
    };
}

// ========================================
// 分析结果显示功能（从 script.js 迁移）
// ========================================

/**
 * 分析结果显示管理器
 */
const AnalysisResultsManager = {
    
    /**
     * 显示分析结果
     * @param {Array} analysisData 分析数据数组
     */
    showAnalysisResults(analysisData) {
        const analysisResultsSection = document.getElementById('analysisResultsSection');
        const analysisResultsContent = document.getElementById('analysisResultsContent');
        
        console.log('showAnalysisResults 接收到的数据:', analysisData);
        
        if (!analysisData || analysisData.length === 0) {
            console.log('分析数据为空，隐藏分析结果');
            if (analysisResultsSection) analysisResultsSection.style.display = 'none';
            return;
        }
        
        // 获取学校数据（现在只有一个学校）
        const school = analysisData[0];
        const totalCurrentArea = school['现有建筑总面积'] || 0;
        const totalRequiredArea = school['应配建筑总面积'] || 0;
        const totalGap = school['建筑面积总缺口（含特殊补助）'] || school['建筑面积总缺口'] || 0;
        
        console.log('学校分析数据:', { totalCurrentArea, totalRequiredArea, totalGap });
        
        // 显示学校概况统计，使用相同底色的四个数据卡片
        const gapWithoutSubsidy = school['建筑面积总缺口（不含特殊补助）'] || 0;
        const gapWithSubsidy = school['建筑面积总缺口（含特殊补助）'] || 0;
        
        // 计算含补助缺口和不含补助缺口的逻辑
        // 在这个系统中：
        // - 正值表示缺口（面积不足）
        // - 负值表示负缺口（面积有剩余）
        // - 缺口计算方式：应配面积 - 现有面积
        // 特殊补助为正值时会增加缺口
        const subsidyTotalArea = school['特殊补助总面积'] || 0;
        
        // 添加调试信息，查看计算过程
        console.log('===== 缺口计算调试信息 =====');
        console.log('现有建筑总面积:', totalCurrentArea);
        console.log('应配建筑总面积:', totalRequiredArea);
        console.log('特殊补助总面积:', subsidyTotalArea);
        console.log('不含补助缺口:', gapWithoutSubsidy, '(正值=缺口,负值=负缺口)');
        console.log('含补助缺口:', gapWithSubsidy, '(正值=缺口,负值=负缺口)');
        console.log('计算关系: 含补助缺口 = 不含补助缺口 + 特殊补助总面积');
        console.log('预期计算结果:', gapWithoutSubsidy + subsidyTotalArea);
        console.log('实际计算结果:', gapWithSubsidy);
        console.log('特殊补助导致的缺口变化:', gapWithSubsidy - gapWithoutSubsidy);
        console.log('==========================');
        
        const summaryHTML = this.generateSummaryHTML(school, totalCurrentArea, totalRequiredArea, gapWithoutSubsidy, gapWithSubsidy);
        const schoolAnalysisHTML = this.generateSchoolAnalysisHTML(analysisData);
        const downloadHTML = this.generateDownloadHTML();
        
        if (analysisResultsContent) {
            // 移除详细分析结果标题和大框，直接显示内容
            analysisResultsContent.innerHTML = summaryHTML + 
                `<div class="direct-analysis-content">
                    ${schoolAnalysisHTML}
                </div>` + 
                downloadHTML;
        }
        if (analysisResultsSection) {
            analysisResultsSection.style.display = 'block';
            // 滚动到分析结果
            setTimeout(() => {
                analysisResultsSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    },
    
    /**
     * 生成汇总HTML
     */
    generateSummaryHTML(school, totalCurrentArea, totalRequiredArea, gapWithoutSubsidy, gapWithSubsidy) {
        const formatNumber = (typeof window.formatNumber === 'function') ? window.formatNumber : 
            (num) => parseFloat(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
        return `
            <div class="analysis-summary">
                <h3>${school['学校名称']} (${school['年份']})</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>现状总建筑面积</h4>
                        <div class="stat-value">${formatNumber(totalCurrentArea)}</div>
                        <div class="stat-unit">(m²)</div>
                    </div>
                    <div class="stat-card">
                        <h4>学生规模测算总建筑面积</h4>
                        <div class="stat-value">${formatNumber(totalRequiredArea)}</div>
                        <div class="stat-unit">(m²)</div>
                    </div>
                    <div class="stat-card">
                        <h4>学生规模测算建筑面积总缺额(不含补助)</h4>
                        <div class="stat-value">${gapWithoutSubsidy > 0 ? '+' : ''}${formatNumber(gapWithoutSubsidy)}</div>
                        <div class="stat-unit">(m²)</div>
                    </div>
                    <div class="stat-card">
                        <h4>学生规模测算建筑面积总缺额(含补助)</h4>
                        <div class="stat-value">${gapWithSubsidy > 0 ? '+' : ''}${formatNumber(gapWithSubsidy)}</div>
                        <div class="stat-unit">(m²)</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * 生成学校详细分析HTML
     */
    generateSchoolAnalysisHTML(analysisData) {
        const formatNumber = (typeof window.formatNumber === 'function') ? window.formatNumber : 
            (num) => parseFloat(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
        return analysisData.map(school => {
            const areaTypes = [
                { 
                    key: 'A', 
                    name: '教学及辅助用房', 
                    current: school['现有教学及辅助用房面积'], 
                    required: school['总应配教学及辅助用房(A)'], 
                    gap: school['教学及辅助用房缺口(A)']
                },
                { 
                    key: 'B', 
                    name: '办公用房', 
                    current: school['现有办公用房面积'], 
                    required: school['总应配办公用房(B)'], 
                    gap: school['办公用房缺口(B)']
                },
                { 
                    key: 'D', 
                    name: '后勤辅助用房', 
                    current: school['现有后勤辅助用房面积'], 
                    required: school['总应配后勤辅助用房(D)'], 
                    gap: school['后勤辅助用房缺口(D)']
                },
                { 
                    key: 'C', 
                    name: '生活配套用房', 
                    current: school['现有生活用房总面积'], 
                    required: (school['总应配学生宿舍(C1)'] || 0) + (school['总应配其他生活用房(C2)'] || 0), 
                    gap: (school['学生宿舍缺口(C1)'] || 0) + (school['其他生活用房缺口(C2)'] || 0)
                },
                { 
                    key: 'C1', 
                    name: '其中:学生宿舍', 
                    current: school['现有学生宿舍面积'], 
                    required: school['总应配学生宿舍(C1)'], 
                    gap: school['学生宿舍缺口(C1)']
                },
                { 
                    key: 'C2', 
                    name: '其中:其他生活用房', 
                    current: school['现有其他生活用房面积（计算）'] || school['现有其他生活用房面积'], 
                    required: school['总应配其他生活用房(C2)'], 
                    gap: school['其他生活用房缺口(C2)']
                },
            ];
            
            const areaAnalysisHTML = areaTypes.map(area => {
                const gapValue = area.gap || 0;
                return `
                    <div class="area-type-analysis">
                        <div class="area-type-title">
                            <span>${area.name}</span>
                        </div>
                        <div class="area-details">
                            <div>
                                <span>现状建筑面积:</span>
                                <span>${formatNumber(area.current || 0)}㎡</span>
                            </div>
                            <div>
                                <span>学生规模测算建筑面积:</span>
                                <span>${formatNumber(area.required || 0)}㎡</span>
                            </div>
                            <div>
                                <span>学生规模测算建筑面积缺额:</span>
                                <span class="${gapValue > 0 ? 'gap-positive' : 'gap-negative'}">
                                    ${gapValue > 0 ? '+' : ''}${formatNumber(gapValue)}㎡
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            return `
                <div class="analysis-grid">
                    ${areaAnalysisHTML}
                </div>
            `;
        }).join('');
    },
    
    /**
     * 生成下载区域HTML
     */
    generateDownloadHTML() {
        return `
            <div class="download-section">
                <button class="download-link" onclick="downloadOnlineResult()">
                    下载完整分析报告
                </button>
            </div>
            <div class="summary-note" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; color: #5a6c7d; font-size: 14px; line-height: 1.5;">
                <strong>计算说明：</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>现状面积 = 既有建筑面积 + 在建建筑面积</li>
                    <li>测算面积 = 各类用房面积系数 × 全日制学生数 + 全日制及留学硕博生补助面积</li>
                    <li>缺额面积（不含补助） = 测算面积 − 现状面积</li>
                    <li>缺额面积（含补助） = 测算面积 + 特殊用房补助面积 − 现状面积</li>
                    <li>若缺额面积 > 0，则存在缺口；否则无缺口。</li>
                </ul>
            </div>
        `;
    },
    
    /**
     * 显示在线计算结果
     */
    displayOnlineCalculationResult(result) {
        console.log('开始显示在线计算结果:', result);
        
        // 保存完整的结果数据供下载使用
        if (typeof window !== 'undefined') {
            window.globalAnalysisResult = result;
        }
        
        // 显示详细的分析结果
        console.log('显示分析结果，使用schoolData:', result.schoolData);
        this.showAnalysisResults([result.schoolData]);
        
        // 滚动到分析结果区域
        const analysisSection = document.getElementById('analysisResultsSection');
        if (analysisSection) {
            analysisSection.scrollIntoView({ behavior: 'smooth' });
        }
    },
    
    /**
     * 下载在线计算结果
     */
    async downloadOnlineResult() {
        try {
            // 检查是否有保存的分析结果
            const globalAnalysisResult = (typeof window !== 'undefined') ? window.globalAnalysisResult : null;
            if (!globalAnalysisResult) {
                if (typeof showErrorMessage === 'function') {
                    showErrorMessage('没有可下载的分析结果，请先进行数据分析');
                } else {
                    alert('没有可下载的分析结果，请先进行数据分析');
                }
                return;
            }
            
            const result = globalAnalysisResult;
            
            console.log('准备下载，数据包含:', Object.keys(result.schoolData));
            console.log('填报单位信息:', result.schoolData['填报单位']);
            
            // 发送到服务器生成Excel文件
            const response = await fetch('/online-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    processedSchoolData: [result.schoolData], // 使用正确的参数名，并包装为数组
                    analysisResult: result.schoolData
                })
            });
            
            if (!response.ok) {
                throw new Error(`服务器错误: ${response.status}`);
            }
            
            const downloadResult = await response.json();
            
            if (downloadResult.success) {
                // 直接触发下载
                window.location.href = downloadResult.downloadUrl;
                if (typeof showSuccessMessage === 'function') {
                    showSuccessMessage('报告生成成功，开始下载...');
                } else if (typeof showMessage === 'function') {
                    showMessage('报告生成成功，开始下载...', 'info');
                }
            } else {
                throw new Error(downloadResult.error || '生成下载文件失败');
            }
            
        } catch (error) {
            console.error('下载失败:', error);
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('下载失败: ' + error.message);
            } else {
                alert('下载失败: ' + error.message);
            }
        }
    },
    
    /**
     * 生成特殊补助明细表格
     */
    generateSubsidyTable(subsidyDetails) {
        if (!subsidyDetails || !Array.isArray(subsidyDetails) || subsidyDetails.length === 0) {
            return '<span class="no-subsidy">无特殊补助项目</span>';
        }
        
        const formatNumber = (typeof window.formatNumber === 'function') ? window.formatNumber : 
            (num) => parseFloat(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        let tableHTML = '<table class="subsidy-table">';
        tableHTML += '<thead><tr><th>补助名称</th><th>补助面积(㎡)</th></tr></thead>';
        tableHTML += '<tbody>';
        
        subsidyDetails.forEach(item => {
            tableHTML += `<tr>
                <td>${item.name || '未命名项目'}</td>
                <td class="area-value">${formatNumber(item.area || 0)}</td>
            </tr>`;
        });
        
        tableHTML += '</tbody></table>';
        return tableHTML;
    }
};

// ========================================
// 兼容性函数（从 script.js 迁移）
// ========================================

/**
 * 显示分析结果（兼容性）
 */
function showAnalysisResults(analysisData) {
    return AnalysisResultsManager.showAnalysisResults(analysisData);
}

/**
 * 显示在线计算结果（兼容性）
 */
function displayOnlineCalculationResult(result) {
    return AnalysisResultsManager.displayOnlineCalculationResult(result);
}

/**
 * 下载在线结果（兼容性）
 */
function downloadOnlineResult() {
    return AnalysisResultsManager.downloadOnlineResult();
}

/**
 * 生成特殊补助表格（兼容性）
 */
function generateSubsidyTable(subsidyDetails) {
    return AnalysisResultsManager.generateSubsidyTable(subsidyDetails);
}

// 支持模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        DataManagementManager, 
        dataManagementManager,
        AnalysisResultsManager,
        showAnalysisResults,
        displayOnlineCalculationResult,
        downloadOnlineResult,
        generateSubsidyTable
    };
}

// ========================================
// 全局导出
// ========================================

if (typeof window !== 'undefined') {
    // 主管理器
    window.DataManagementManager = DataManagementManager;
    window.AnalysisResultsManager = AnalysisResultsManager;
    
    // 兼容性函数
    window.showAnalysisResults = showAnalysisResults;
    window.displayOnlineCalculationResult = displayOnlineCalculationResult;
    window.downloadOnlineResult = downloadOnlineResult;
    window.generateSubsidyTable = generateSubsidyTable;
}
