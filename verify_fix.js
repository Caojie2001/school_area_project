const XLSX = require('xlsx');
const fs = require('fs');

if (fs.existsSync('test_fixed.xlsx')) {
    const workbook = XLSX.readFile('test_fixed.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    console.log('=== 修正后的Excel检查 ===');
    
    // 检查年份 - 现在应该在B3
    const yearCellB3 = worksheet['B3'];
    const yearCellC3 = worksheet['C3']; 
    console.log('B3单元格（年份）:', yearCellB3 ? yearCellB3.v : '无值');
    console.log('C3单元格:', yearCellC3 ? yearCellC3.v : '无值');
    
    // 检查合并单元格信息
    if (worksheet['!merges']) {
        console.log('\n合并单元格信息:');
        worksheet['!merges'].forEach((merge, index) => {
            const startRow = merge.s.r + 1;
            const startCol = String.fromCharCode(65 + merge.s.c);
            const endRow = merge.e.r + 1;
            const endCol = String.fromCharCode(65 + merge.e.c);
            console.log(`合并${index + 1}: ${startCol}${startRow}:${endCol}${endRow}`);
        });
    }
    
    // 显示前几行完整内容
    console.log('\n表格内容:');
    for (let row = 1; row <= 6; row++) {
        let rowData = [];
        for (let col = 1; col <= 4; col++) {
            const cellAddress = XLSX.utils.encode_cell({r: row-1, c: col-1});
            const cell = worksheet[cellAddress];
            rowData.push(cell ? cell.v : '');
        }
        if (rowData.some(val => val !== '')) {
            console.log(`第${row}行:`, rowData);
        }
    }
} else {
    console.log('测试文件不存在');
}
