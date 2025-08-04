const express = require('express');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// 引入数据库相关模块
require('dotenv').config();
const { testConnection, initializeTables } = require('./database');
const dataService = require('./dataService');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 创建output文件夹（如果不存在）
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// 清理临时文件功能
function cleanupOldFiles() {
    try {
        const files = fs.readdirSync(outputDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24小时，单位：毫秒
        
        let deletedCount = 0;
        
        files.forEach(file => {
            const filePath = path.join(outputDir, file);
            const stats = fs.statSync(filePath);
            
            // 如果文件超过24小时就删除
            if (now - stats.mtime.getTime() > maxAge) {
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`删除过期文件: ${file}`);
                } catch (error) {
                    console.error(`删除文件失败 ${file}:`, error.message);
                }
            }
        });
        
        if (deletedCount > 0) {
            console.log(`清理完成，共删除 ${deletedCount} 个过期文件`);
        }
    } catch (error) {
        console.error('清理临时文件时出错:', error.message);
    }
}

// 立即执行一次清理
cleanupOldFiles();

// 设置定时清理：每2小时执行一次
setInterval(cleanupOldFiles, 2 * 60 * 60 * 1000);

// 首页路由 - 高校建筑面积缺口测算系统
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 在线计算路由
app.post('/online-calculate', async (req, res) => {
    try {
        const { schoolData, specialSubsidies } = req.body;
        
        if (!schoolData) {
            return res.status(400).json({ error: '缺少学校数据' });
        }
        
        // 计算建筑面积缺口
        const analysisResult = calculateBuildingAreaGap(schoolData, specialSubsidies || []);
        
        // 添加处理时间和来源信息
        const processedSchoolData = {
            ...schoolData,
            ...analysisResult,
            '来源方式': '在线填写',
            '处理时间': new Date().toLocaleString('zh-CN'),
            '特殊补助记录数': specialSubsidies ? specialSubsidies.length : 0,
            // 确保包含显示所需的字段
            '现有其他生活用房面积': analysisResult['现有其他生活用房面积（计算）'] || 0,
            '年份': schoolData['年份'] || new Date().getFullYear()
        };
        
        // 保存数据到数据库
        try {
            console.log('开始保存数据到数据库...');
            const schoolInfoId = await dataService.saveSchoolInfo(schoolData, specialSubsidies, analysisResult);
            console.log('数据保存成功，学校ID:', schoolInfoId);
            
            // 在响应中添加数据库保存信息
            processedSchoolData['数据库记录ID'] = schoolInfoId;
        } catch (dbError) {
            console.error('数据库保存失败:', dbError);
            // 数据库保存失败不影响计算结果返回，只记录错误
            processedSchoolData['数据库状态'] = '保存失败: ' + dbError.message;
        }
        
        res.json({
            success: true,
            schoolData: processedSchoolData,
            analysisResult: analysisResult,
            message: '在线计算完成'
        });
        
    } catch (error) {
        console.error('在线计算时出错:', error);
        res.status(500).json({ error: '在线计算时出错: ' + error.message });
    }
});

// 在线计算结果下载路由
app.post('/online-download', (req, res) => {
    try {
        const { schoolData, analysisResult } = req.body;
        
        if (!schoolData) {
            return res.status(400).json({ error: '缺少计算结果数据' });
        }
        
        // 生成Excel文件
        const timestamp = Date.now();
        const fileName = `${schoolData['学校名称'] || '在线计算'}_建筑规模测算结果_${timestamp}.xlsx`;
        const filePath = path.join(outputDir, fileName);
        
        console.log('生成Excel文件:', fileName);
        console.log('文件路径:', filePath);
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 创建标准格式的测算结果表
        const data = [
            ['高校建筑规模测算结果'],
            [],
            ['测算年份', schoolData['年份'] || new Date().getFullYear(), ''],
            ['单位/学校(机构)名称(章)', schoolData['学校名称'] || '', '学校类型', schoolData['学校类型'] || ''],
            [],
            ['规划学生数'],
            ['专科学生数(人)', schoolData['全日制专科生人数'] || 0, '本科学生数(人)', schoolData['全日制本专科生人数'] || 0],
            ['硕士学生数(人)', schoolData['全日制硕士生人数'] || 0, '博士学生数(人)', schoolData['全日制博士生人数'] || 0],
            ['本科留学生数(人)', schoolData['留学生本科生人数'] || 0, '硕士留学生数(人)', schoolData['留学生硕士生人数'] || 0],
            ['博士留学生数(人)', schoolData['留学生博士生人数'] || 0],
            [],
            ['测算结果'],
            ['用房类型', '规划建筑面积(㎡)', '现状建筑面积(㎡)', '建筑面积缺口(㎡)'],
            ['教学及辅助用房', schoolData['总应配教学及辅助用房(A)'] || 0, schoolData['现有教学及辅助用房面积'] || 0, schoolData['教学及辅助用房缺口(A)'] || 0],
            ['办公用房', schoolData['总应配办公用房(B)'] || 0, schoolData['现有办公用房面积'] || 0, schoolData['办公用房缺口(B)'] || 0],
            ['后勤辅助用房', schoolData['总应配后勤辅助用房(D)'] || 0, schoolData['现有后勤辅助用房面积'] || 0, schoolData['后勤辅助用房缺口(D)'] || 0],
            ['生活配套用房', schoolData['总应配学生宿舍(C1)'] + schoolData['总应配其他生活用房(C2)'] || 0, schoolData['现有生活用房总面积'] || 0, (schoolData['学生宿舍缺口(C1)'] || 0) + (schoolData['其他生活用房缺口(C2)'] || 0)],
            ['其中:学生宿舍', schoolData['总应配学生宿舍(C1)'] || 0, schoolData['现有学生宿舍面积'] || 0, schoolData['学生宿舍缺口(C1)'] || 0],
            ['其中:其他生活用房', schoolData['总应配其他生活用房(C2)'] || 0, schoolData['现有其他生活用房面积（计算）'] || 0, schoolData['其他生活用房缺口(C2)'] || 0],
            [],
            ['建筑面积总缺口(不含补助)(㎡)', '', '', schoolData['建筑面积总缺口（不含特殊补助）'] || 0],
            ['补助建筑总面积(㎡)', '', '', schoolData['特殊补助总面积'] || 0],
            ['建筑面积总缺口(含补助)(㎡)', '', '', schoolData['建筑面积总缺口（含特殊补助）'] || 0]
        ];
        
        // 创建工作表
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // 设置列宽
        ws['!cols'] = [
            { wch: 25 }, // 第一列
            { wch: 20 }, // 第二列  
            { wch: 20 }, // 第三列
            { wch: 20 }  // 第四列
        ];
        
        // 合并单元格
        const merges = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // 标题行
            { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } }, // 测算年份值
            { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } }, // 规划学生数标题
            { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } }, // 测算结果标题
        ];
        
        ws['!merges'] = merges;
        
        // 设置单元格样式（标题居中）
        if (!ws['A1']) ws['A1'] = {};
        ws['A1'].s = {
            alignment: { horizontal: 'center', vertical: 'center' },
            font: { bold: true, size: 14 }
        };
        
        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, "建筑规模测算结果");
        
        // 如果有特殊补助明细，创建特殊补助工作表
        if (schoolData['特殊补助明细'] && Array.isArray(schoolData['特殊补助明细']) && schoolData['特殊补助明细'].length > 0) {
            const subsidyData = [
                ['特殊补助明细'],
                [],
                ['补助项目名称', '补助面积(㎡)']
            ];
            
            schoolData['特殊补助明细'].forEach(item => {
                subsidyData.push([item.name || '', item.area || 0]);
            });
            
            const subsidyWs = XLSX.utils.aoa_to_sheet(subsidyData);
            subsidyWs['!cols'] = [{ wch: 30 }, { wch: 15 }];
            
            // 合并标题
            subsidyWs['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
            ];
            
            XLSX.utils.book_append_sheet(wb, subsidyWs, "特殊补助明细");
        }
        
        // 写入文件
        XLSX.writeFile(wb, filePath);
        
        console.log('Excel文件生成成功');
        
        // 返回下载URL
        const downloadUrl = `/download/${fileName}`;
        res.json({
            success: true,
            downloadUrl: downloadUrl,
            fileName: fileName,
            message: '报告生成成功'
        });
        
    } catch (error) {
        console.error('生成下载文件时出错:', error);
        res.status(500).json({ error: '生成下载文件时出错: ' + error.message });
    }
});

// 数据管理API路由

// 获取所有学校历史数据（支持年份筛选）
app.get('/api/schools', async (req, res) => {
    try {
        const { year } = req.query;
        const yearFilter = year && year !== 'all' ? parseInt(year) : null;
        const schools = await dataService.getSchoolHistory(yearFilter);
        res.json({ success: true, data: schools });
    } catch (error) {
        console.error('获取学校历史数据失败:', error);
        res.status(500).json({ success: false, error: '获取数据失败' });
    }
});

// 获取各校各年度最新记录（支持年份和学校筛选）
app.get('/api/schools/latest', async (req, res) => {
    try {
        const { year, school } = req.query;
        const yearFilter = year && year !== 'all' ? parseInt(year) : null;
        const schoolFilter = school && school !== 'all' ? school : null;
        
        // 返回符合条件的每个学校的最新记录
        const schools = await dataService.getLatestSchoolRecords(yearFilter, schoolFilter);
        
        res.json({ success: true, data: schools });
    } catch (error) {
        console.error('获取学校数据失败:', error);
        res.status(500).json({ success: false, error: '获取数据失败' });
    }
});



// 获取可用年份
app.get('/api/years', async (req, res) => {
    try {
        const years = await dataService.getAvailableYears();
        res.json({ success: true, data: years });
    } catch (error) {
        console.error('获取年份数据失败:', error);
        res.status(500).json({ success: false, error: '获取年份数据失败' });
    }
});

// 获取学校历史记录
app.get('/api/school-history/:schoolName', async (req, res) => {
    try {
        const { schoolName } = req.params;
        const { limit = 10 } = req.query;
        
        const history = await dataService.getSchoolHistory(schoolName, parseInt(limit));
        
        res.json({
            success: true,
            data: history,
            message: '获取历史记录成功'
        });
    } catch (error) {
        console.error('获取历史记录失败:', error);
        res.status(500).json({ error: '获取历史记录失败: ' + error.message });
    }
});

// 获取统计数据（支持年份筛选）
app.get('/api/statistics', async (req, res) => {
    try {
        const { year } = req.query;
        const yearFilter = year && year !== 'all' ? parseInt(year) : null;
        const stats = await dataService.getStatistics(yearFilter);
        
        res.json({
            success: true,
            data: stats,
            message: '获取统计数据成功'
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({ error: '获取统计数据失败: ' + error.message });
    }
});

// 批量导出功能
app.post('/api/batch-export', async (req, res) => {
    try {
        const { year, schoolType, exportType = 'all' } = req.body;
        
        // 根据筛选条件获取数据 - 使用最新记录函数
        let schoolsData = [];
        
        if (exportType === 'filtered') {
            // 按条件筛选导出 - 只导出每个学校每个年份的最新记录
            const yearFilter = year && year !== 'all' ? parseInt(year) : null;
            schoolsData = await dataService.getLatestSchoolRecords(yearFilter);
            
            // 如果指定了学校类型，进一步筛选
            if (schoolType && schoolType !== 'all') {
                schoolsData = schoolsData.filter(school => school.school_type === schoolType);
            }
        } else {
            // 导出所有数据 - 只导出每个学校每个年份的最新记录
            schoolsData = await dataService.getLatestSchoolRecords();
        }
        
        if (schoolsData.length === 0) {
            return res.status(400).json({ error: '没有找到符合条件的数据' });
        }
        
        // 生成批量导出Excel文件
        const filename = await generateBatchExportExcel(schoolsData, { year, schoolType });
        const downloadUrl = `/download/${filename}`;
        
        res.json({
            success: true,
            downloadUrl: downloadUrl,
            fileName: filename,
            recordCount: schoolsData.length,
            message: `成功导出 ${schoolsData.length} 条记录`
        });
        
    } catch (error) {
        console.error('批量导出失败:', error);
        res.status(500).json({ error: '批量导出失败: ' + error.message });
    }
});

// 删除学校记录
app.delete('/api/school-record/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await dataService.deleteSchoolRecord(parseInt(id));
        
        res.json({
            success: true,
            message: '记录删除成功'
        });
    } catch (error) {
        console.error('删除记录失败:', error);
        res.status(500).json({ error: '删除记录失败: ' + error.message });
    }
});

// 下载单条记录
app.get('/api/download-record/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 获取记录详情
        const recordData = await dataService.getSchoolRecordById(parseInt(id));
        
        if (!recordData) {
            return res.status(404).json({ error: '记录不存在' });
        }

        // 生成文件名
        const timestamp = Date.now();
        const fileName = `${recordData.school_name}_建筑规模测算结果_${timestamp}.xlsx`;
        const filePath = path.join(outputDir, fileName);
        
        console.log('生成Excel文件:', fileName);
        console.log('文件路径:', filePath);
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 创建标准格式的测算结果表
        const data = [
            ['高校建筑规模测算结果'],
            [],
            ['测算年份', recordData.year || new Date().getFullYear(), ''],
            ['单位/学校(机构)名称(章)', recordData.school_name || '', '学校类型', recordData.school_type || ''],
            [],
            ['规划学生数'],
            ['专科学生数(人)', recordData.full_time_specialist || 0, '本科学生数(人)', recordData.full_time_undergraduate || 0],
            ['硕士学生数(人)', recordData.full_time_master || 0, '博士学生数(人)', recordData.full_time_doctor || 0],
            ['本科留学生数(人)', recordData.international_undergraduate || 0, '硕士留学生数(人)', recordData.international_master || 0],
            ['博士留学生数(人)', recordData.international_doctor || 0],
            [],
            ['测算结果'],
            ['用房类型', '规划建筑面积(㎡)', '现状建筑面积(㎡)', '建筑面积缺口(㎡)'],
        ];

        // 从计算结果中解析数据
        let calculationData = {};
        if (recordData.calculation_results) {
            try {
                calculationData = JSON.parse(recordData.calculation_results);
            } catch (error) {
                console.error('解析计算结果失败:', error);
            }
        }

        // 添加测算结果数据
        data.push(
            ['教学及辅助用房', calculationData['总应配教学及辅助用房(A)'] || 0, recordData.teaching_area || 0, recordData.teaching_area_gap || 0],
            ['办公用房', calculationData['总应配办公用房(B)'] || 0, recordData.office_area || 0, recordData.office_area_gap || 0],
            ['后勤辅助用房', calculationData['总应配后勤辅助用房(D)'] || 0, recordData.logistics_area || 0, recordData.logistics_area_gap || 0],
            ['生活配套用房', 
                (calculationData['总应配学生宿舍(C1)'] || 0) + (calculationData['总应配其他生活用房(C2)'] || 0), 
                recordData.total_living_area || 0, 
                (recordData.dormitory_area_gap || 0) + (recordData.other_living_area_gap || 0)
            ],
            ['其中:学生宿舍', calculationData['总应配学生宿舍(C1)'] || 0, recordData.dormitory_area || 0, recordData.dormitory_area_gap || 0],
            ['其中:其他生活用房', calculationData['总应配其他生活用房(C2)'] || 0, calculationData['现有其他生活用房面积（计算）'] || 0, recordData.other_living_area_gap || 0],
            [],
            ['建筑面积总缺口(不含补助)(㎡)', '', '', calculationData['建筑面积总缺口（不含特殊补助）'] || 0],
            ['补助建筑总面积(㎡)', '', '', recordData.special_subsidy_total || 0],
            ['建筑面积总缺口(含补助)(㎡)', '', '', recordData.total_area_gap || 0]
        );
        
        // 创建工作表
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // 设置列宽
        ws['!cols'] = [
            { wch: 25 }, // 第一列
            { wch: 20 }, // 第二列  
            { wch: 20 }, // 第三列
            { wch: 20 }  // 第四列
        ];
        
        // 合并单元格
        const merges = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // 标题行
            { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } }, // 测算年份值
            { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } }, // 规划学生数标题
            { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } }, // 测算结果标题
        ];
        
        ws['!merges'] = merges;
        
        // 设置单元格样式（标题居中）
        if (!ws['A1']) ws['A1'] = {};
        ws['A1'].s = {
            alignment: { horizontal: 'center', vertical: 'center' },
            font: { bold: true, size: 14 }
        };
        
        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, "建筑规模测算结果");
        
        // 如果有特殊补助明细，创建特殊补助工作表
        if (recordData.special_subsidies) {
            let subsidyDetails = [];
            try {
                if (typeof recordData.special_subsidies === 'string') {
                    subsidyDetails = JSON.parse(recordData.special_subsidies);
                } else if (Array.isArray(recordData.special_subsidies)) {
                    subsidyDetails = recordData.special_subsidies;
                }
            } catch (error) {
                console.error('解析特殊补助数据失败:', error);
            }

            if (subsidyDetails && subsidyDetails.length > 0) {
                const subsidyData = [
                    ['特殊补助明细'],
                    [],
                    ['补助项目名称', '补助面积(㎡)']
                ];
                
                subsidyDetails.forEach(item => {
                    subsidyData.push([item.name || item['特殊用房补助名称'] || '', item.area || item['补助面积（m²）'] || 0]);
                });
                
                const subsidyWs = XLSX.utils.aoa_to_sheet(subsidyData);
                subsidyWs['!cols'] = [{ wch: 30 }, { wch: 15 }];
                
                // 合并标题
                subsidyWs['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
                ];
                
                XLSX.utils.book_append_sheet(wb, subsidyWs, "特殊补助明细");
            }
        }
        
        // 写入文件
        XLSX.writeFile(wb, filePath);
        
        // 设置响应头并发送文件
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('文件下载失败:', err);
            }
            // 下载完成后删除临时文件（延迟删除）
            setTimeout(() => {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`已删除下载完成的文件: ${fileName}`);
                    }
                } catch (deleteError) {
                    console.error(`删除文件失败 ${fileName}:`, deleteError.message);
                }
            }, 10 * 60 * 1000); // 10分钟后删除
        });
        
    } catch (error) {
        console.error('下载记录失败:', error);
        res.status(500).json({ error: '下载记录失败: ' + error.message });
    }
});

// 清空所有数据
app.delete('/api/clear-all-data', async (req, res) => {
    try {
        await dataService.clearAllData();
        
        res.json({
            success: true,
            message: '所有数据已清空'
        });
    } catch (error) {
        console.error('清空数据失败:', error);
        res.status(500).json({ error: '清空数据失败: ' + error.message });
    }
});

// 学校类型映射
const SCHOOL_TYPES = {
    '综合师范': 'X',
    '工科医学农林': 'Y', 
    '政法财经外语': 'Z',
    '艺术': 'M',
    '体育': 'T'
};

const SCHOOL_TYPES_REVERSE = {
    'X': '综合师范',
    'Y': '工科医学农林',
    'Z': '政法财经外语',
    'M': '艺术',
    'T': '体育'
};

// 详细学校类型到计算类型的映射
const DETAILED_SCHOOL_TYPE_MAPPING = {
    // 综合师范类 -> X
    '综合类': 'X',
    '师范类': 'X',
    
    // 工科医学农林类 -> Y
    '工科类': 'Y',
    '医学类': 'Y',
    '农林类': 'Y',
    
    // 政法财经外语类 -> Z
    '政法类': 'Z',
    '财经类': 'Z',
    '外语类': 'Z',
    
    // 艺术类 -> M
    '艺术类': 'M',
    
    // 体育类 -> T
    '体育类': 'T'
};

// 计算类型到详细类型的反向映射（用于模板说明）
const CALCULATION_TO_DETAILED_TYPES = {
    'X': ['综合类', '师范类'],
    'Y': ['工科类', '医学类', '农林类'],
    'Z': ['政法类', '财经类', '外语类'],
    'M': ['艺术类'],
    'T': ['体育类']
};

// 学校名称到类型的硬编码映射
const SCHOOL_NAME_TO_TYPE = {
    '上海大学': '综合类',
    '上海交通大学医学院': '医学类',
    '上海理工大学': '工科类',
    '上海师范大学': '师范类',
    '上海科技大学': '工科类',
    '华东政法大学': '政法类',
    '上海海事大学': '工科类',
    '上海海洋大学': '工科类',
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
    '上海旅游高等专科学校': '工科类',
    '上海城建职业学院': '工科类',
    '上海电子信息职业技术学院': '工科类',
    '上海工艺美术职业学院': '工科类',
    '上海农林职业技术学院': '农林类',
    '上海健康医学院附属卫生学校(上海健康护理职业学院(筹))': '医学类'
};

// 基础应配面积标准
const BASIC_AREA_STANDARDS = {
    'X': { A: 12.95, B: 2, C1: 10, C2: 2, D: 1.55 },
    'Y': { A: 15.95, B: 2, C1: 10, C2: 2, D: 1.55 },
    'Z': { A: 7.95, B: 2, C1: 10, C2: 2, D: 1.55 },
    'M': { A: 53.5, B: 3.5, C1: 10, C2: 2.5, D: 2 },
    'T': { A: 22, B: 2.2, C1: 10, C2: 2, D: 1.8 }
};

// 补贴应配面积标准
const SUBSIDIZED_AREA_STANDARDS = {
    'X': { A: {Master: 3, Doctor: 3, International: 0}, B: {Master: 2, Doctor: 2, International: 0}, C1: {Master: 5, Doctor: 14, International: 0}, C2: {Master: 0, Doctor: 0, International: 19}, D: {Master: 0, Doctor: 0, International: 0} },
    'Y': { A: {Master: 3, Doctor: 3, International: 0}, B: {Master: 2, Doctor: 2, International: 0}, C1: {Master: 5, Doctor: 14, International: 0}, C2: {Master: 0, Doctor: 0, International: 19}, D: {Master: 0, Doctor: 0, International: 0} },
    'Z': { A: {Master: 3, Doctor: 3, International: 0}, B: {Master: 2, Doctor: 2, International: 0}, C1: {Master: 5, Doctor: 14, International: 0}, C2: {Master: 0, Doctor: 0, International: 19}, D: {Master: 0, Doctor: 0, International: 0} },
    'M': { A: {Master: 3, Doctor: 3, International: 0}, B: {Master: 2, Doctor: 2, International: 0}, C1: {Master: 5, Doctor: 14, International: 0}, C2: {Master: 0, Doctor: 0, International: 19}, D: {Master: 0, Doctor: 0, International: 0} },
    'T': { A: {Master: 3, Doctor: 3, International: 0}, B: {Master: 2, Doctor: 2, International: 0}, C1: {Master: 5, Doctor: 14, International: 0}, C2: {Master: 0, Doctor: 0, International: 19}, D: {Master: 0, Doctor: 0, International: 0} }
};

// 处理Excel文件的函数
// 生成批量导出Excel文件
function generateBatchExportExcel(schoolsData, filters = {}) {
    const timestamp = Date.now();
    const filterSuffix = [];
    if (filters.year) filterSuffix.push(`${filters.year}年`);
    if (filters.schoolType && filters.schoolType !== 'all') filterSuffix.push(filters.schoolType);
    
    const fileName = `高校建筑面积缺口批量导出_${filterSuffix.length > 0 ? filterSuffix.join('_') + '_' : ''}${timestamp}.xlsx`;
    const filePath = path.join(outputDir, fileName);
    
    try {
        // 创建新的工作簿
        const wb = XLSX.utils.book_new();
        
        // 数据转换：将数据库格式转换为Excel输出格式
        const excelData = schoolsData.map(school => {
            // 解析特殊补助JSON数据
            let specialSubsidies = [];
            let specialSubsidyTotalArea = 0;
            let specialSubsidyDetails = '无特殊补助';
            
            try {
                if (school.special_subsidies) {
                    specialSubsidies = JSON.parse(school.special_subsidies);
                    if (Array.isArray(specialSubsidies) && specialSubsidies.length > 0) {
                        specialSubsidyTotalArea = specialSubsidies.reduce((sum, item) => 
                            sum + (parseFloat(item['补助面积（m²）']) || 0), 0);
                        specialSubsidyDetails = specialSubsidies.map(item => 
                            `${item['特殊用房补助名称']}:${item['补助面积（m²）']}m²`
                        ).join('; ');
                    }
                }
            } catch (e) {
                console.warn('解析特殊补助数据失败:', e);
            }
            
            // 构建Excel行数据
            return {
                '学校名称': school.school_name,
                '学校类型': school.school_type,
                '统计年份': school.year,
                '录入时间': new Date(school.created_at).toLocaleString('zh-CN'),
                '学生总人数': school.total_students,
                '全日制本科生': school.fulltime_undergrad,
                '全日制专科生': school.fulltime_specialist || 0,
                '全日制硕士生': school.fulltime_master,
                '全日制博士生': school.fulltime_doctor,
                '留学生本科生': school.international_undergrad,
                '留学生专科生': school.international_specialist || 0,
                '留学生硕士生': school.international_master,
                '留学生博士生': school.international_doctor,
                '现有教学及辅助用房面积': school.current_teaching_area,
                '现有办公用房面积': school.current_office_area,
                '现有学生宿舍面积': school.current_dormitory_area,
                '现有生活用房总面积': school.current_living_area,
                '现有后勤辅助用房面积': school.current_logistics_area,
                '现有建筑总面积': school.current_total_area,
                '应配建筑总面积': school.required_total_area,
                '建筑面积总缺口（不含补助）': school.gap_without_subsidy,
                '建筑面积总缺口（含补助）': school.total_gap,
                '特殊补助总面积': specialSubsidyTotalArea,
                '特殊补助项目数': specialSubsidies.length,
                '特殊补助明细': specialSubsidyDetails,
                '整体达标情况': school.total_gap <= 0 ? '达标' : '不达标',
                '教学用房达标情况': school.teaching_gap <= 0 ? '达标' : '不达标',
                '办公用房达标情况': school.office_gap <= 0 ? '达标' : '不达标',
                '学生宿舍达标情况': school.dormitory_gap <= 0 ? '达标' : '不达标',
                '其他生活用房达标情况': school.other_living_gap <= 0 ? '达标' : '不达标',
                '后勤用房达标情况': school.logistics_gap <= 0 ? '达标' : '不达标'
            };
        });
        
        // 详细数据工作表
        const detailSheet = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, detailSheet, "学校详细数据");
        
        // 生成统计汇总工作表
        const summaryData = generateBatchSummaryData(schoolsData, filters);
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, "统计汇总");
        
        // 按学校类型分析
        const typeAnalysisData = generateTypeAnalysisData(schoolsData);
        const typeSheet = XLSX.utils.json_to_sheet(typeAnalysisData);
        XLSX.utils.book_append_sheet(wb, typeSheet, "学校类型分析");
        
        // 写入文件
        XLSX.writeFile(wb, filePath);
        
        return fileName;
    } catch (error) {
        console.error('生成批量导出Excel时出错:', error);
        throw error;
    }
}

// 生成批量导出的统计汇总数据
function generateBatchSummaryData(schoolsData, filters) {
    const summary = [];
    
    // 基本信息
    summary.push(
        { '统计项目': '导出时间', '数值': new Date().toLocaleString('zh-CN'), '单位': '' },
        { '统计项目': '导出学校数量', '数值': schoolsData.length, '单位': '所' }
    );
    
    if (filters.year) {
        summary.push({ '统计项目': '筛选年份', '数值': filters.year, '单位': '' });
    }
    if (filters.schoolType && filters.schoolType !== 'all') {
        summary.push({ '统计项目': '筛选学校类型', '数值': filters.schoolType, '单位': '' });
    }
    
    // 计算总体统计
    let totalStudents = 0;
    let totalCurrentArea = 0;
    let totalRequiredArea = 0;
    let totalGap = 0;
    let complianceCount = 0;
    
    schoolsData.forEach(school => {
        totalStudents += school.total_students || 0;
        totalCurrentArea += school.current_total_area || 0;
        totalRequiredArea += school.required_total_area || 0;
        totalGap += school.total_gap || 0;
        
        if ((school.total_gap || 0) <= 0) {
            complianceCount++;
        }
    });
    
    summary.push(
        { '统计项目': '', '数值': '', '单位': '' }, // 空行
        { '统计项目': '=== 总体统计 ===', '数值': '', '单位': '' },
        { '统计项目': '学生总人数', '数值': totalStudents, '单位': '人' },
        { '统计项目': '现有建筑总面积', '数值': Math.round(totalCurrentArea), '单位': '平方米' },
        { '统计项目': '应配建筑总面积', '数值': Math.round(totalRequiredArea), '单位': '平方米' },
        { '统计项目': '建筑面积总缺口', '数值': Math.round(totalGap), '单位': '平方米' },
        { '统计项目': '整体达标学校数', '数值': complianceCount, '单位': '所' },
        { '统计项目': '整体达标率', '数值': Math.round(complianceCount / schoolsData.length * 100 * 100) / 100, '单位': '%' }
    );
    
    return summary;
}

// 生成学校类型分析数据
function generateTypeAnalysisData(schoolsData) {
    const typeStats = {};
    
    schoolsData.forEach(school => {
        const type = school.school_type || '未知';
        
        if (!typeStats[type]) {
            typeStats[type] = {
                '学校类型': type,
                '学校数量': 0,
                '学生总数': 0,
                '现有建筑总面积': 0,
                '应配建筑总面积': 0,
                '建筑面积总缺口': 0,
                '达标学校数': 0
            };
        }
        
        typeStats[type]['学校数量']++;
        typeStats[type]['学生总数'] += school.total_students || 0;
        typeStats[type]['现有建筑总面积'] += school.current_total_area || 0;
        typeStats[type]['应配建筑总面积'] += school.required_total_area || 0;
        typeStats[type]['建筑面积总缺口'] += school.total_gap || 0;
        
        if ((school.total_gap || 0) <= 0) {
            typeStats[type]['达标学校数']++;
        }
    });
    
    // 计算达标率
    Object.values(typeStats).forEach(type => {
        type['达标率(%)'] = Math.round(type['达标学校数'] / type['学校数量'] * 100 * 100) / 100;
        type['平均学生数/校'] = Math.round(type['学生总数'] / type['学校数量']);
        type['平均现有面积/校'] = Math.round(type['现有建筑总面积'] / type['学校数量']);
        type['平均应配面积/校'] = Math.round(type['应配建筑总面积'] / type['学校数量']);
        type['平均缺口/校'] = Math.round(type['建筑面积总缺口'] / type['学校数量']);
    });
    
    return Object.values(typeStats);
}

// 计算建筑面积缺口的函数
function calculateBuildingAreaGap(data, specialSubsidyData = []) {
    try {
        const schoolName = data['学校名称'] || '';
        
        // 从学校名称硬编码映射中获取学校类型
        let schoolTypeText = SCHOOL_NAME_TO_TYPE[schoolName];
        
        // 如果没有找到对应的学校，尝试从Excel中读取学校类型（向后兼容）
        if (!schoolTypeText) {
            schoolTypeText = data['学校类型'] || '';
        }
        
        // 如果仍然没有找到，设为默认值
        if (!schoolTypeText) {
            schoolTypeText = '综合类';
        }
        
        // 从详细类型映射中获取计算类型
        let schoolType = DETAILED_SCHOOL_TYPE_MAPPING[schoolTypeText];
        
        // 如果没有找到，再尝试从原始的五大类映射中获取
        if (!schoolType) {
            schoolType = SCHOOL_TYPES[schoolTypeText];
        }
        
        // 如果仍然没有找到，默认为综合类
        if (!schoolType) {
            schoolType = 'X';
        }
        
        const year = parseFloat(data['年份']) || new Date().getFullYear();
        const totalStudents = parseFloat(data['学生总人数']) || 0;
        
        // 从新的学生人数结构中提取数据
        const fullTimeUndergraduate = parseFloat(data['全日制本专科生人数']) || 0;
        const fullTimeMaster = parseFloat(data['全日制硕士生人数']) || 0;
        const fullTimeDoctor = parseFloat(data['全日制博士生人数']) || 0;
        const internationalUndergraduate = parseFloat(data['留学生本科生人数']) || 0;
        const internationalMaster = parseFloat(data['留学生硕士生人数']) || 0;
        const internationalDoctor = parseFloat(data['留学生博士生人数']) || 0;
        
        // 计算各类学生总数
        const allUndergraduate = fullTimeUndergraduate + internationalUndergraduate;
        const allMaster = fullTimeMaster + internationalMaster;
        const allDoctor = fullTimeDoctor + internationalDoctor;
        const allInternational = internationalUndergraduate + internationalMaster + internationalDoctor;
        
        // 向后兼容：如果使用旧字段名，则转换
        const undergraduateStudents = allUndergraduate || parseFloat(data['本专科生人数']) || 0;
        const masterStudents = allMaster || parseFloat(data['硕士研究生人数']) || 0;
        const doctorStudents = allDoctor || parseFloat(data['博士研究生人数']) || 0;
        const internationalStudents = allInternational || parseFloat(data['留学生人数']) || 0;
        
        // 现有面积
        const currentArea = {
            A: parseFloat(data['现有教学及辅助用房面积']) || 0,
            B: parseFloat(data['现有办公用房面积']) || 0,
            C1: parseFloat(data['现有学生宿舍面积']) || 0,
            C2: 0, // 将通过计算得出
            D: parseFloat(data['现有后勤辅助用房面积']) || 0
        };
        
        // 计算C2 = 生活用房总面积 - 学生宿舍面积
        const totalLivingArea = parseFloat(data['现有生活用房总面积']) || 0;
        const dormitoryArea = parseFloat(data['现有学生宿舍面积']) || 0;
        currentArea.C2 = Math.max(0, totalLivingArea - dormitoryArea); // 确保不为负数
        
        // 获取标准
        const basicStandards = BASIC_AREA_STANDARDS[schoolType];
        const subsidizedStandards = SUBSIDIZED_AREA_STANDARDS[schoolType];
        
        // 计算基础应配面积
        const basicRequiredArea = {
            A: basicStandards.A * totalStudents,
            B: basicStandards.B * totalStudents, 
            C1: basicStandards.C1 * totalStudents,
            C2: basicStandards.C2 * totalStudents,
            D: basicStandards.D * totalStudents
        };
        
        // 计算补贴面积（按要求：基础值按全日制、留学生人数之和计算，再额外按博士生、硕士生、留学生数量计算额外值）
        const subsidizedArea = {
            A: subsidizedStandards.A.Master * allMaster + subsidizedStandards.A.Doctor * allDoctor + subsidizedStandards.A.International * allInternational,
            B: subsidizedStandards.B.Master * allMaster + subsidizedStandards.B.Doctor * allDoctor + subsidizedStandards.B.International * allInternational,
            C1: subsidizedStandards.C1.Master * allMaster + subsidizedStandards.C1.Doctor * allDoctor + subsidizedStandards.C1.International * allInternational,
            C2: subsidizedStandards.C2.Master * allMaster + subsidizedStandards.C2.Doctor * allDoctor + subsidizedStandards.C2.International * allInternational,
            D: subsidizedStandards.D.Master * allMaster + subsidizedStandards.D.Doctor * allDoctor + subsidizedStandards.D.International * allInternational
        };
        
        // 计算总应配面积
        const totalRequiredArea = {
            A: basicRequiredArea.A + subsidizedArea.A,
            B: basicRequiredArea.B + subsidizedArea.B,
            C1: basicRequiredArea.C1 + subsidizedArea.C1,
            C2: basicRequiredArea.C2 + subsidizedArea.C2,
            D: basicRequiredArea.D + subsidizedArea.D
        };
        
        // 计算特殊补助总面积
        const totalSpecialSubsidy = specialSubsidyData.reduce((sum, item) => {
            const area = parseFloat(item['补助面积（m²）']) || 0;
            return sum + area;
        }, 0);
        
        // 准备特殊补助明细数据（保持原始结构用于表格显示）
        const specialSubsidyDetails = specialSubsidyData.map(item => ({
            name: item['特殊用房补助名称'],
            area: item['补助面积（m²）']
        }));
        
        // 计算面积缺口：应配面积 - 现有面积 （正值表示缺口）
        const areaGap = {
            A: totalRequiredArea.A - currentArea.A,
            B: totalRequiredArea.B - currentArea.B,
            C1: totalRequiredArea.C1 - currentArea.C1,
            C2: totalRequiredArea.C2 - currentArea.C2,
            D: totalRequiredArea.D - currentArea.D
        };
        
        // 计算总缺口（特殊补助增加缺口）
        const totalCurrentArea = Object.values(currentArea).reduce((sum, area) => sum + area, 0);
        const totalRequiredAreaSum = Object.values(totalRequiredArea).reduce((sum, area) => sum + area, 0);
        const totalGapBeforeSpecial = totalRequiredAreaSum - totalCurrentArea; // 应配面积 - 现有面积
        const totalGap = totalGapBeforeSpecial + totalSpecialSubsidy; // 特殊补助增加缺口
        const totalSubsidizedArea = Object.values(subsidizedArea).reduce((sum, area) => sum + area, 0);
        
        return {
            '学校名称': schoolName,
            '学校类型': schoolTypeText,
            '学校类型代码': schoolType,
            '计算使用类型': SCHOOL_TYPES_REVERSE[schoolType],
            '全日制本专科生人数': fullTimeUndergraduate,
            '全日制硕士生人数': fullTimeMaster,
            '全日制博士生人数': fullTimeDoctor,
            '留学生本科生人数': internationalUndergraduate,
            '留学生硕士生人数': internationalMaster,
            '留学生博士生人数': internationalDoctor,
            '学生总人数': totalStudents,
            '本专科生总人数': allUndergraduate,
            '硕士生总人数': allMaster,
            '博士生总人数': allDoctor,
            '留学生总人数': allInternational,
            '现有生活用房总面积': Math.round(totalLivingArea),
            '现有学生宿舍面积': Math.round(dormitoryArea),
            '现有其他生活用房面积（计算）': Math.round(currentArea.C2),
            '基础应配教学及辅助用房(A)': Math.round(basicRequiredArea.A),
            '基础应配办公用房(B)': Math.round(basicRequiredArea.B),
            '基础应配学生宿舍(C1)': Math.round(basicRequiredArea.C1),
            '基础应配其他生活用房(C2)': Math.round(basicRequiredArea.C2),
            '基础应配后勤辅助用房(D)': Math.round(basicRequiredArea.D),
            '补贴教学及辅助用房(A)': Math.round(subsidizedArea.A),
            '补贴办公用房(B)': Math.round(subsidizedArea.B),
            '补贴学生宿舍(C1)': Math.round(subsidizedArea.C1),
            '补贴其他生活用房(C2)': Math.round(subsidizedArea.C2),
            '补贴后勤辅助用房(D)': Math.round(subsidizedArea.D),
            '总应配教学及辅助用房(A)': Math.round(totalRequiredArea.A),
            '总应配办公用房(B)': Math.round(totalRequiredArea.B),
            '总应配学生宿舍(C1)': Math.round(totalRequiredArea.C1),
            '总应配其他生活用房(C2)': Math.round(totalRequiredArea.C2),
            '总应配后勤辅助用房(D)': Math.round(totalRequiredArea.D),
            '教学及辅助用房缺口(A)': Math.round(areaGap.A),
            '办公用房缺口(B)': Math.round(areaGap.B),
            '学生宿舍缺口(C1)': Math.round(areaGap.C1),
            '其他生活用房缺口(C2)': Math.round(areaGap.C2),
            '后勤辅助用房缺口(D)': Math.round(areaGap.D),
            '现有建筑总面积': Math.round(totalCurrentArea),
            '应配建筑总面积': Math.round(totalRequiredAreaSum),
            '建筑面积总缺口（含特殊补助）': Math.round(totalGap),
            '建筑面积总缺口（不含特殊补助）': Math.round(totalGapBeforeSpecial),
            '特殊补助总面积': Math.round(totalSpecialSubsidy),
            '特殊补助明细': specialSubsidyDetails,
            '特殊补助项目数': specialSubsidyData.length,
            '补贴总面积': Math.round(totalSubsidizedArea),
            '教学及辅助用房达标情况': areaGap.A <= 0 ? '达标' : '不达标',
            '办公用房达标情况': areaGap.B <= 0 ? '达标' : '不达标',
            '学生宿舍达标情况': areaGap.C1 <= 0 ? '达标' : '不达标',
            '其他生活用房达标情况': areaGap.C2 <= 0 ? '达标' : '不达标',
            '后勤辅助用房达标情况': areaGap.D <= 0 ? '达标' : '不达标',
            '整体达标情况': totalGap <= 0 ? '达标' : '不达标'
        };
    } catch (error) {
        console.error('计算建筑面积缺口时出错:', error);
        return {
            '计算状态': '计算出错',
            '错误信息': error.message
        };
    }
}

// 文件下载路由
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(outputDir, filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('下载文件时出错:', err);
                res.status(500).json({ error: '下载文件时出错' });
            } else {
                // 下载成功后，延迟10分钟删除文件
                setTimeout(() => {
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log(`已删除下载完成的文件: ${filename}`);
                        }
                    } catch (deleteError) {
                        console.error(`删除已下载文件失败 ${filename}:`, deleteError.message);
                    }
                }, 10 * 60 * 1000); // 10分钟后删除
            }
        });
    } else {
        res.status(404).json({ error: '文件不存在' });
    }
});

// 清理临时文件路由
app.delete('/cleanup', (req, res) => {
    try {
        // 清理输出文件夹中的旧文件（保留最近的5个文件）
        const outputFiles = fs.readdirSync(outputDir)
            .map(file => ({
                name: file,
                path: path.join(outputDir, file),
                time: fs.statSync(path.join(outputDir, file)).mtime
            }))
            .sort((a, b) => b.time - a.time);
        
        // 删除超过5个的旧文件
        if (outputFiles.length > 5) {
            outputFiles.slice(5).forEach(file => {
                fs.unlinkSync(file.path);
            });
        }
        
        res.json({ success: true, message: '临时文件清理完成' });
    } catch (error) {
        res.status(500).json({ error: '清理文件时出错: ' + error.message });
    }
});

// 错误处理中间件
app.use((error, req, res, next) => {
    res.status(500).json({ error: error.message });
});

// 启动服务器
async function startServer() {
    try {
        console.log('正在初始化数据库连接...');
        
        // 测试数据库连接
        const isConnected = await testConnection();
        if (!isConnected) {
            console.log('数据库连接失败，服务器将在无数据库模式下运行');
        } else {
            // 初始化数据库表
            await initializeTables();
            console.log('数据库初始化完成');
        }
        
        // 启动HTTP服务器
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
            if (isConnected) {
                console.log('MySQL数据库连接正常，数据将被持久化保存');
            } else {
                console.log('数据库未连接，数据将不会被持久化保存');
            }
        });
        
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 优雅关闭处理
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n正在关闭服务器...');
    process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;
