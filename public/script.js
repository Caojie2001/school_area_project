// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeOnlineForm();
    // 初始化计算函数
    setTimeout(() => {
        calculateTotalStudents();
        calculateOtherLivingArea();
        calculateTotalBuildingArea();
        updateSubsidySummary();
    }, 100);
});

// 计算学生总数
function calculateTotalStudents() {
    // 全日制学生
    const fullTimeSpecialist = parseInt((document.getElementById('fullTimeSpecialist') && document.getElementById('fullTimeSpecialist').value) || 0);
    const fullTimeUndergraduate = parseInt((document.getElementById('fullTimeUndergraduate') && document.getElementById('fullTimeUndergraduate').value) || 0);
    const fullTimeMaster = parseInt((document.getElementById('fullTimeMaster') && document.getElementById('fullTimeMaster').value) || 0);
    const fullTimeDoctor = parseInt((document.getElementById('fullTimeDoctor') && document.getElementById('fullTimeDoctor').value) || 0);
    
    const fullTimeTotal = fullTimeSpecialist + fullTimeUndergraduate + fullTimeMaster + fullTimeDoctor;
    
    // 留学生（不包括专科生）
    const internationalUndergraduate = parseInt((document.getElementById('internationalUndergraduate') && document.getElementById('internationalUndergraduate').value) || 0);
    const internationalMaster = parseInt((document.getElementById('internationalMaster') && document.getElementById('internationalMaster').value) || 0);
    const internationalDoctor = parseInt((document.getElementById('internationalDoctor') && document.getElementById('internationalDoctor').value) || 0);
    
    const internationalTotal = internationalUndergraduate + internationalMaster + internationalDoctor;
    
    // 更新显示
    const fullTimeTotalEl = document.getElementById('fullTimeTotal');
    if (fullTimeTotalEl) fullTimeTotalEl.value = fullTimeTotal;
    
    const internationalTotalEl = document.getElementById('internationalTotal');
    if (internationalTotalEl) internationalTotalEl.value = internationalTotal;
    
    // 计算总学生数
    const totalStudents = fullTimeTotal + internationalTotal;
    const totalStudentsEl = document.getElementById('totalStudents');
    if (totalStudentsEl) totalStudentsEl.value = totalStudents;
    
    console.log('计算学生总数:', { fullTimeTotal, internationalTotal, totalStudents });
    
    return {
        fullTimeTotal,
        internationalTotal,
        totalStudents
    };
}

// 全局变量存储完整的分析结果，用于下载功能
let globalAnalysisResult = null;

// 进度和结果显示函数
function showProgress() {
    const progressSection = document.getElementById('progressSection');
    if (progressSection) {
        progressSection.style.display = 'block';
        progressSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function updateProgress(percentage, text) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) progressFill.style.width = percentage + '%';
    if (progressText) progressText.textContent = text;
}

function hideProgress() {
    const progressSection = document.getElementById('progressSection');
    if (progressSection) {
        progressSection.style.display = 'none';
    }
}

// 显示消息提示
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
        border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
        color: ${type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 3000);
}

// 格式化数字
function formatNumber(num) {
    if (num === null || num === undefined || num === '') return '0.00';
    return parseFloat(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 格式化为两位小数（不带千分符）
function formatToTwoDecimals(num) {
    if (num === null || num === undefined || num === '') return '0.00';
    return parseFloat(num).toFixed(2);
}

// 生成特殊补助明细表格
function generateSubsidyTable(subsidyDetails) {
    if (!subsidyDetails || !Array.isArray(subsidyDetails) || subsidyDetails.length === 0) {
        return '<span class="no-subsidy">无特殊补助项目</span>';
    }
    
    let tableHTML = '<table class="subsidy-table">';
    tableHTML += '<thead><tr><th>补助项目名称</th><th>补助面积(㎡)</th></tr></thead>';
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

// 显示学校信息
function displaySchoolInfo(schoolData) {
    const schoolInfoSection = document.getElementById('schoolInfoSection');
    const schoolInfoContent = document.getElementById('schoolInfoContent');
    
    console.log('displaySchoolInfo 接收到的数据:', schoolData);
    
    if (!schoolData || schoolData.length === 0) {
        console.log('学校数据为空，隐藏学校信息');
        if (schoolInfoSection) schoolInfoSection.style.display = 'none';
        return;
    }
    
    const schoolCards = schoolData.map(school => {
        return `
            <div class="school-card">
                <div class="school-header">
                    <h4 class="school-name">${school['学校名称'] || '未知学校'}</h4>
                    <span class="school-type">${school['学校类型'] || '未知类型'}</span>
                </div>
                
                <div class="school-stats">
                    <div class="stat-item">
                        <span class="stat-label">统计年份</span>
                        <span class="stat-value">${school['年份'] || 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">学生总人数</span>
                        <span class="stat-value">${formatNumber(school['学生总人数'])}人</span>
                    </div>
                    
                    <div class="stat-group">
                        <div class="stat-group-title">全日制学生构成</div>
                        <div class="stat-item">
                            <span class="stat-label">本专科生</span>
                            <span class="stat-value">${formatNumber(school['全日制本专科生人数'])}人</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">硕士研究生</span>
                            <span class="stat-value">${formatNumber(school['全日制硕士生人数'])}人</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">博士研究生</span>
                            <span class="stat-value">${formatNumber(school['全日制博士生人数'])}人</span>
                        </div>
                    </div>
                    
                    <div class="stat-group">
                        <div class="stat-group-title">留学生构成</div>
                        <div class="stat-item">
                            <span class="stat-label">留学生本科生</span>
                            <span class="stat-value">${formatNumber(school['留学生本科生人数'])}人</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">留学生硕士生</span>
                            <span class="stat-value">${formatNumber(school['留学生硕士生人数'])}人</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">留学生博士生</span>
                            <span class="stat-value">${formatNumber(school['留学生博士生人数'])}人</span>
                        </div>
                    </div>
                    
                    <div class="stat-group">
                        <div class="stat-group-title">现状建筑面积 (㎡)</div>
                        <div class="stat-item">
                            <span class="stat-label">教学及辅助用房</span>
                            <span class="stat-value">${formatNumber(school['现有教学及辅助用房面积'])}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">办公用房</span>
                            <span class="stat-value">${formatNumber(school['现有办公用房面积'])}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">学生宿舍</span>
                            <span class="stat-value">${formatNumber(school['现有学生宿舍面积'])}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">其他生活用房</span>
                            <span class="stat-value">${formatNumber(school['现有其他生活用房面积'])}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">后勤辅助用房</span>
                            <span class="stat-value">${formatNumber(school['现有后勤辅助用房面积'])}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    if (schoolInfoContent) schoolInfoContent.innerHTML = schoolCards;
    if (schoolInfoSection) schoolInfoSection.style.display = 'block';
}

    // 显示分析结果
function showAnalysisResults(analysisData) {
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
    const isCompliant = school['整体达标情况'] === '达标';
    const totalCurrentArea = school['现有建筑总面积'] || 0;
    const totalRequiredArea = school['应配建筑总面积'] || 0;
    const totalGap = school['建筑面积总缺口（含特殊补助）'] || school['建筑面积总缺口'] || 0;
    
    console.log('学校分析数据:', { isCompliant, totalCurrentArea, totalRequiredArea, totalGap });
    
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
    
    const summaryHTML = `
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
    
    // 生成学校详细分析
    const schoolAnalysisHTML = analysisData.map(school => {
        const isCompliant = school['整体达标情况'] === '达标';
        const areaTypes = [
            { 
                key: 'A', 
                name: '教学及辅助用房', 
                current: school['现有教学及辅助用房面积'], 
                required: school['总应配教学及辅助用房(A)'], 
                gap: school['教学及辅助用房缺口(A)'], 
                status: school['教学及辅助用房达标情况']
            },
            { 
                key: 'B', 
                name: '办公用房', 
                current: school['现有办公用房面积'], 
                required: school['总应配办公用房(B)'], 
                gap: school['办公用房缺口(B)'], 
                status: school['办公用房达标情况']
            },
            { 
                key: 'D', 
                name: '后勤辅助用房', 
                current: school['现有后勤辅助用房面积'], 
                required: school['总应配后勤辅助用房(D)'], 
                gap: school['后勤辅助用房缺口(D)'], 
                status: school['后勤辅助用房达标情况']
            },
            { 
                key: 'C', 
                name: '生活配套用房', 
                current: school['现有生活用房总面积'], 
                required: (school['总应配学生宿舍(C1)'] || 0) + (school['总应配其他生活用房(C2)'] || 0), 
                gap: (school['学生宿舍缺口(C1)'] || 0) + (school['其他生活用房缺口(C2)'] || 0), 
                status: ((school['学生宿舍缺口(C1)'] || 0) + (school['其他生活用房缺口(C2)'] || 0)) <= 0 ? '达标' : '不达标'
            },
            { 
                key: 'C1', 
                name: '其中:学生宿舍', 
                current: school['现有学生宿舍面积'], 
                required: school['总应配学生宿舍(C1)'], 
                gap: school['学生宿舍缺口(C1)'], 
                status: school['学生宿舍达标情况']
            },
            { 
                key: 'C2', 
                name: '其中:其他生活用房', 
                current: school['现有其他生活用房面积（计算）'] || school['现有其他生活用房面积'], 
                required: school['总应配其他生活用房(C2)'], 
                gap: school['其他生活用房缺口(C2)'], 
                status: school['其他生活用房达标情况']
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
    
    // 生成下载按钮区域
    const downloadHTML = `
        <div class="download-section">
            <button class="download-link" onclick="downloadOnlineResult()">
                下载完整分析报告
            </button>
        </div>
    `;
    
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
}// 初始化在线表单
function initializeOnlineForm() {
    const schoolSelect = document.getElementById('schoolName');
    const schoolTypeDisplay = document.getElementById('schoolTypeDisplay');
    const totalLivingArea = document.getElementById('totalLivingArea');
    const dormitoryArea = document.getElementById('dormitoryArea');
    const otherLivingArea = document.getElementById('otherLivingArea');
    const form = document.getElementById('onlineDataForm');
    
    // 学校选择变化时显示类型
    schoolSelect.addEventListener('change', updateSchoolType);
    
    // 年份改变事件监听
    const yearInput = document.getElementById('year');
    
    totalLivingArea.addEventListener('input', function() {
        calculateOtherLivingArea();
        calculateTotalBuildingArea();
    });
    dormitoryArea.addEventListener('input', function() {
        calculateOtherLivingArea();
        calculateTotalBuildingArea();
    });
    
    // 为学生人数输入框添加事件监听
    const studentInputs = [
        'fullTimeUndergraduate', 'fullTimeSpecialist', 'fullTimeMaster', 'fullTimeDoctor',
        'internationalUndergraduate', 'internationalSpecialist', 'internationalMaster', 'internationalDoctor'
    ];
    
    studentInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', calculateTotalStudents);
        }
    });
    
    // 为建筑面积输入框添加事件监听
    const buildingAreaInputs = [
        'teachingArea', 'officeArea', 'logisticsArea', 'totalLivingArea', 'dormitoryArea'
    ];
    
    buildingAreaInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // 设置默认值
            if (!input.value || input.value === '0') {
                input.value = '0.00';
            }
            
            // 添加输入事件监听
            input.addEventListener('input', function() {
                calculateOtherLivingArea();
                calculateTotalBuildingArea();
            });
            
            // 添加失去焦点事件，自动格式化为两位小数
            input.addEventListener('blur', function() {
                const value = parseFloat(this.value) || 0;
                this.value = formatToTwoDecimals(value);
            });
        }
    });
    
    // 表单提交事件
    form.addEventListener('submit', handleOnlineFormSubmit);
    
    // 初始化特殊补助汇总
    updateSubsidySummary();
}

// 更新学校类型显示 - 全局函数
function updateSchoolType() {
    const schoolSelect = document.getElementById('schoolName');
    const schoolTypeDisplay = document.getElementById('schoolTypeDisplay');
    
    const schoolTypes = {
        '上海大学': '综合类',
        '上海交通大学医学院': '医学类',
        '上海理工大学': '工科类',
        '上海师范大学': '师范类',
        '上海科技大学': '工科类',
        '华东政法大学': '政法类',
        '上海海事大学': '工科类',
        '上海海洋大学': '农林类',
        '上海中医药大学': '医学类',
        '上海体育大学': '体育类',
        '上海音乐学院': '艺术类',
        '上海戏剧学院': '艺术类',
        '上海电力大学': '工科类',
        '上海对外经贸大学': '财经类',
        '上海应用技术大学': '工科类',
        '上海立信会计金融学院': '财经类',
        '上海工程技术大学': '工科类',
        '上海第二工业大学': '工科类',
        '上海商学院': '财经类',
        '上海电机学院': '工科类',
        '上海政法学院': '政法类',
        '上海健康医学院': '医学类',
        '上海出版印刷高等专科学校': '工科类',
        '上海旅游高等专科学校': '其他',
        '上海城建职业学院': '工科类',
        '上海电子信息职业技术学院': '工科类',
        '上海工艺美术职业学院': '工科类',
        '上海农林职业技术学院': '农林类',
        '上海健康医学院附属卫生学校(上海健康护理职业学院(筹))': '医学类'
    };
    
    if (schoolSelect && schoolTypeDisplay) {
        const selectedSchool = schoolSelect.value;
        if (selectedSchool && schoolTypes[selectedSchool]) {
            schoolTypeDisplay.textContent = `学校类型: ${schoolTypes[selectedSchool]}`;
        } else {
            schoolTypeDisplay.textContent = '';
        }
    }
}

// 计算其他生活用房面积 - 全局函数
function calculateOtherLivingArea() {
    const totalLivingArea = document.getElementById('totalLivingArea');
    const dormitoryArea = document.getElementById('dormitoryArea');
    const otherLivingArea = document.getElementById('otherLivingArea');
    
    if (totalLivingArea && dormitoryArea && otherLivingArea) {
        const total = parseFloat(totalLivingArea.value) || 0;
        const dormitory = parseFloat(dormitoryArea.value) || 0;
        const other = Math.max(0, total - dormitory);
        otherLivingArea.value = formatToTwoDecimals(other);
    }
}

// 计算学生总人数 - 全局函数
function calculateTotalStudents() {
    // 全日制学生
    const fullTimeUndergraduate = parseFloat(document.getElementById('fullTimeUndergraduate').value) || 0;
    const fullTimeSpecialist = parseFloat(document.getElementById('fullTimeSpecialist').value) || 0;
    const fullTimeMaster = parseFloat(document.getElementById('fullTimeMaster').value) || 0;
    const fullTimeDoctor = parseFloat(document.getElementById('fullTimeDoctor').value) || 0;
    
    // 留学生
    const internationalUndergraduate = parseFloat(document.getElementById('internationalUndergraduate').value) || 0;
    const internationalSpecialist = parseFloat(document.getElementById('internationalSpecialist').value) || 0;
    const internationalMaster = parseFloat(document.getElementById('internationalMaster').value) || 0;
    const internationalDoctor = parseFloat(document.getElementById('internationalDoctor').value) || 0;
    
    // 计算全日制学生总数
    const fullTimeTotal = fullTimeUndergraduate + fullTimeSpecialist + fullTimeMaster + fullTimeDoctor;
    const fullTimeTotalEl = document.getElementById('fullTimeTotal');
    if (fullTimeTotalEl) {
        fullTimeTotalEl.value = fullTimeTotal.toLocaleString();
    }
    
    // 计算留学生总数
    const internationalTotal = internationalUndergraduate + internationalSpecialist + internationalMaster + internationalDoctor;
    const internationalTotalEl = document.getElementById('internationalTotal');
    if (internationalTotalEl) {
        internationalTotalEl.value = internationalTotal.toLocaleString();
    }
    
    // 计算学生总人数
    const total = fullTimeTotal + internationalTotal;
    const totalStudentsEl = document.getElementById('totalStudents');
    if (totalStudentsEl) {
        totalStudentsEl.value = total.toLocaleString();
    }
}

// 计算建筑总面积 - 全局函数
function calculateTotalBuildingArea() {
    // 获取各类建筑面积
    const teachingArea = parseFloat(document.getElementById('teachingArea').value) || 0;
    const officeArea = parseFloat(document.getElementById('officeArea').value) || 0;
    const totalLivingArea = parseFloat(document.getElementById('totalLivingArea').value) || 0;
    const logisticsArea = parseFloat(document.getElementById('logisticsArea').value) || 0;
    
    // 计算建筑总面积
    // 注意：生活用房使用总面积，不重复计算宿舍和其他生活用房
    const totalArea = teachingArea + officeArea + totalLivingArea + logisticsArea;
    
    const totalBuildingAreaEl = document.getElementById('totalBuildingArea');
    if (totalBuildingAreaEl) {
        totalBuildingAreaEl.value = formatToTwoDecimals(totalArea);
    }
}

// 添加特殊补助
function addSubsidy() {
    const specialSubsidies = document.getElementById('specialSubsidies');
    const existingItems = specialSubsidies.querySelectorAll('.subsidy-item');
    
    const subsidyItem = document.createElement('div');
    subsidyItem.className = 'subsidy-item';
    
    // 如果是第一个补助项，添加表头
    if (existingItems.length === 0) {
        subsidyItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>补助名称</label>
                    <input type="text" name="subsidyName[]" placeholder="如：重点实验室建设补助" class="form-control">
                </div>
                <div class="form-group">
                    <label>补助面积 (m²)</label>
                    <input type="number" name="subsidyArea[]" min="0" step="0.01" value="0.00" placeholder="请输入补助面积" class="form-control" onblur="formatSubsidyArea(this)">
                </div>
                <div class="form-group">
                    <label>&nbsp;</label>
                    <button type="button" class="btn btn-danger" onclick="removeSubsidy(this)" style="background: #dc3545; color: white; border: none; padding: 12px 15px; border-radius: 6px; cursor: pointer;">删除</button>
                </div>
            </div>
        `;
    } else {
        // 如果不是第一个，不添加标签
        subsidyItem.innerHTML = `
            <div class="form-row">
                <div class="form-group no-label">
                    <input type="text" name="subsidyName[]" placeholder="如：重点实验室建设补助" class="form-control">
                </div>
                <div class="form-group no-label">
                    <input type="number" name="subsidyArea[]" min="0" step="0.01" value="0.00" placeholder="请输入补助面积" class="form-control" onblur="formatSubsidyArea(this)">
                </div>
                <div class="form-group">
                    <button type="button" class="btn btn-danger" onclick="removeSubsidy(this)" style="background: #dc3545; color: white; border: none; padding: 12px 15px; border-radius: 6px; cursor: pointer;">删除</button>
                </div>
            </div>
        `;
    }
    
    specialSubsidies.appendChild(subsidyItem);
    
    // 更新特殊补助汇总
    updateSubsidySummary();
}

// 格式化特殊补助面积输入框
function formatSubsidyArea(input) {
    const value = parseFloat(input.value) || 0;
    input.value = formatToTwoDecimals(value);
    // 触发汇总更新
    updateSubsidySummary();
}

// 删除特殊补助
function removeSubsidy(button) {
    const subsidyItem = button.closest('.subsidy-item');
    const specialSubsidies = document.getElementById('specialSubsidies');
    const allItems = specialSubsidies.querySelectorAll('.subsidy-item');
    
    // 检查是否删除的是第一个带标签的项目
    const isFirstItem = subsidyItem === allItems[0];
    const hasLabel = subsidyItem.querySelector('label');
    
    // 删除当前项目
    subsidyItem.remove();
    
    // 如果删除的是第一个带标签的项目，且还有其他项目，需要给下一个项目添加标签
    if (isFirstItem && hasLabel) {
        const remainingItems = specialSubsidies.querySelectorAll('.subsidy-item');
        if (remainingItems.length > 0) {
            const nextItem = remainingItems[0];
            const formGroups = nextItem.querySelectorAll('.form-group');
            
            // 为前两个form-group添加标签
            if (formGroups.length >= 2) {
                // 补助名称标签
                const nameGroup = formGroups[0];
                if (!nameGroup.querySelector('label')) {
                    const nameLabel = document.createElement('label');
                    nameLabel.textContent = '补助名称';
                    nameGroup.insertBefore(nameLabel, nameGroup.firstChild);
                    nameGroup.classList.remove('no-label');
                }
                
                // 补助面积标签
                const areaGroup = formGroups[1];
                if (!areaGroup.querySelector('label')) {
                    const areaLabel = document.createElement('label');
                    areaLabel.textContent = '补助面积 (m²)';
                    areaGroup.insertBefore(areaLabel, areaGroup.firstChild);
                    areaGroup.classList.remove('no-label');
                }
                
                // 删除按钮标签（空白标签）
                const buttonGroup = formGroups[2];
                if (buttonGroup && !buttonGroup.querySelector('label')) {
                    const buttonLabel = document.createElement('label');
                    buttonLabel.innerHTML = '&nbsp;';
                    buttonGroup.insertBefore(buttonLabel, buttonGroup.firstChild);
                }
            }
        }
    }
    
    // 更新特殊补助汇总
    updateSubsidySummary();
}

// 更新特殊补助汇总
function updateSubsidySummary() {
    const specialSubsidies = document.getElementById('specialSubsidies');
    const subsidyItems = specialSubsidies.querySelectorAll('.subsidy-item:not(.subsidy-summary)');
    
    // 移除现有的汇总行
    const existingSummary = specialSubsidies.querySelector('.subsidy-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    // 计算汇总数据
    let totalCount = 0;
    let totalArea = 0;
    
    subsidyItems.forEach(item => {
        const nameInput = item.querySelector('input[name="subsidyName[]"]');
        const areaInput = item.querySelector('input[name="subsidyArea[]"]');
        
        if (nameInput && nameInput.value.trim()) {
            totalCount++;
        }
        
        if (areaInput && areaInput.value) {
            const area = parseFloat(areaInput.value) || 0;
            totalArea += area;
        }
    });
    
    // 创建汇总行
    const summaryRow = document.createElement('div');
    summaryRow.className = 'subsidy-item subsidy-summary';
    summaryRow.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>特殊补助项目数 (个)</label>
                <input type="text" value="${totalCount}" readonly class="form-control" style="background: #f5f5f5; border: 1px solid #ddd; font-weight: bold; text-align: center;">
            </div>
            <div class="form-group">
                <label>特殊补助总面积 (m²)</label>
                <input type="text" value="${formatToTwoDecimals(totalArea)}" readonly class="form-control" style="background: #f5f5f5; border: 1px solid #ddd; font-weight: bold; text-align: center;">
            </div>
            <div class="form-group">
                <label>&nbsp;</label>
                <div style="height: 46px;">&nbsp;</div>
            </div>
        </div>
    `;
    
    // 添加汇总行到特殊补助容器末尾
    specialSubsidies.appendChild(summaryRow);
    
    // 为输入框添加监听器，实时更新汇总
    subsidyItems.forEach(item => {
        const nameInput = item.querySelector('input[name="subsidyName[]"]');
        const areaInput = item.querySelector('input[name="subsidyArea[]"]');
        
        if (nameInput) {
            nameInput.removeEventListener('input', updateSubsidySummary);
            nameInput.addEventListener('input', updateSubsidySummary);
        }
        
        if (areaInput) {
            areaInput.removeEventListener('input', updateSubsidySummary);
            areaInput.addEventListener('input', updateSubsidySummary);
        }
    });
}

// 重置表单
function resetForm() {
    if (confirm('确定要重置表单吗？所有填写的数据将被清空。')) {
        document.getElementById('onlineDataForm').reset();
        document.getElementById('schoolTypeDisplay').textContent = '';
        document.getElementById('otherLivingArea').value = '';
        document.getElementById('totalStudents').value = '';
        document.getElementById('fullTimeTotal').value = '';
        document.getElementById('internationalTotal').value = '';
        document.getElementById('totalBuildingArea').value = '0.00';
        
        // 清空所有特殊补助项
        const specialSubsidies = document.getElementById('specialSubsidies');
        specialSubsidies.innerHTML = '';
        
        // 更新特殊补助汇总
        updateSubsidySummary();
    }
}

// 处理在线表单提交
async function handleOnlineFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // 收集特殊补助数据
    const subsidyNames = formData.getAll('subsidyName[]');
    const subsidyAreas = formData.getAll('subsidyArea[]');
    const specialSubsidies = [];
    
    for (let i = 0; i < subsidyNames.length; i++) {
        if (subsidyNames[i].trim() && subsidyAreas[i] && parseFloat(subsidyAreas[i]) > 0) {
            specialSubsidies.push({
                '特殊用房补助名称': subsidyNames[i].trim(),
                '补助面积（m²）': parseFloat(subsidyAreas[i])
            });
        }
    }
    
    // 构造数据对象
    const selectedSchoolName = formData.get('schoolName');
    const schoolTypeDisplay = document.getElementById('schoolTypeDisplay');
    const schoolTypeText = schoolTypeDisplay ? schoolTypeDisplay.textContent : '';
    const schoolType = schoolTypeText ? schoolTypeText.replace('学校类型: ', '') : null;
    
    const schoolData = {
        '学校名称': selectedSchoolName,
        '学校类型': schoolType,
        '年份': parseInt(formData.get('year')),
        '基准年份': parseInt(formData.get('base_year')),
        '全日制本科生人数': parseInt(formData.get('fullTimeUndergraduate')),
        '全日制专科生人数': parseInt(formData.get('fullTimeSpecialist')) || 0,
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
    
    // 向后兼容：计算本专科生总数（用于后端计算逻辑）
    schoolData['全日制本专科生人数'] = schoolData['全日制本科生人数'] + schoolData['全日制专科生人数'];
    
    try {
        // 显示进度
        showProgress();
        updateProgress(20, '正在处理数据...');
        
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
        
        updateProgress(60, '正在计算分析...');
        
        if (!response.ok) {
            throw new Error(`服务器错误: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('收到服务器响应:', result);
        
        updateProgress(100, '计算完成!');
        
        // 显示结果
        setTimeout(() => {
            hideProgress();
            console.log('准备显示结果...');
            displayOnlineCalculationResult(result);
        }, 500);
        
    } catch (error) {
        console.error('计算失败:', error);
        hideProgress();
        alert('计算失败: ' + error.message);
    }
}

// 显示在线计算结果
function displayOnlineCalculationResult(result) {
    console.log('开始显示在线计算结果:', result);
    
    // 保存完整的结果数据供下载使用
    globalAnalysisResult = result;
    
    // 显示详细的分析结果
    console.log('显示分析结果，使用schoolData:', result.schoolData);
    showAnalysisResults([result.schoolData]);
    
    // 滚动到结果区域
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
}

// 显示在线计算结果的下载功能
function showOnlineResultDownload(result) {
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    
    if (resultSection && resultContent) {
        // 在结果区域显示下载按钮
        resultSection.style.display = 'block';
        resultSection.className = 'result-section';
        
        const schoolName = result.schoolData['学校名称'];
        const isCompliant = result.schoolData['整体达标情况'] === '达标';
        const totalGap = result.schoolData['建筑面积总缺口（含特殊补助）'] || 0;
        
        resultContent.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <h4 style="color: ${isCompliant ? '#16a34a' : '#dc2626'}; font-size: 1.5rem; margin-bottom: 15px;">
                    ${isCompliant ? '建筑面积已达标' : '分析完成，发现建筑面积缺口'}
                </h4>
                <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); border-radius: 12px; padding: 25px; margin: 20px 0; border-left: 5px solid ${isCompliant ? '#16a34a' : '#3b82f6'};">
                    <p style="font-size: 1.1rem; margin-bottom: 10px; color: #374151;">
                        <strong>学校：</strong>${schoolName}
                    </p>
                    <p style="font-size: 1.1rem; margin-bottom: 10px; color: #374151;">
                        <strong>分析状态：</strong>
                        <span style="color: ${isCompliant ? '#16a34a' : '#dc2626'}; font-weight: 600;">
                            ${isCompliant ? '整体达标' : '存在缺口'}
                        </span>
                    </p>
                    ${!isCompliant ? `
                    <p style="font-size: 1.1rem; margin-bottom: 10px; color: #374151;">
                        <strong>总缺口面积：</strong>
                        <span style="color: #dc2626; font-weight: 700; font-size: 1.2rem;">
                            ${formatNumber(Math.abs(totalGap))}㎡
                        </span>
                    </p>
                    ` : ''}
                </div>
                <p style="color: #6b7280; margin-bottom: 25px; font-size: 1rem;">
                    建筑面积缺口分析已完成
                </p>
                <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; color: #0369a1;">
                    详细统计分析功能已被禁用
                </div>
            </div>
        `;
    }
}

// 下载在线计算结果
async function downloadOnlineResult() {
    try {
        // 检查是否有保存的分析结果
        if (!globalAnalysisResult) {
            alert('没有可下载的分析结果，请先进行数据分析');
            return;
        }
        
        const result = globalAnalysisResult;
        
        // 发送到服务器生成Excel文件
        const response = await fetch('/online-download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                schoolData: result.schoolData,
                analysisResult: result.schoolData // 使用schoolData作为analysisResult，因为它包含了所有计算结果
            })
        });
        
        if (!response.ok) {
            throw new Error(`服务器错误: ${response.status}`);
        }
        
        const downloadResult = await response.json();
        
        if (downloadResult.success) {
            // 直接触发下载
            window.location.href = downloadResult.downloadUrl;
            showMessage('报告生成成功，开始下载...', 'info');
        } else {
            throw new Error(downloadResult.error || '生成下载文件失败');
        }
        
    } catch (error) {
        console.error('下载失败:', error);
        alert('下载失败: ' + error.message);
    }
}

