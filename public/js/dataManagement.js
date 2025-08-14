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
     * 查看学校详情
     */
    viewDataSchoolDetails(schoolId) {
        const school = this.allDataSchoolsData.find(s => s.id === schoolId);
        if (!school) {
            alert('找不到学校详情');
            return;
        }
        
        // 这里可以继续实现详情展示逻辑...
        console.log('查看学校详情:', school);
        
        // 临时显示提醒，后续可以完善为完整的模态框
        alert(`学校详情：${school.school_name} (${school.year}年)`);
    },
    
    /**
     * 编辑记录
     */
    editDataRecord(recordId) {
        const school = this.allDataSchoolsData.find(s => s.id === recordId);
        if (!school) {
            alert('找不到记录数据');
            return;
        }
        
        // 切换到数据填报页面
        if (typeof showPage === 'function') {
            showPage('data-entry');
        }
        
        // 这里可以继续实现数据回填逻辑...
        console.log('编辑记录:', school);
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
}

// 支持模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataManagementManager, dataManagementManager };
}
