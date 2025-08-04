const XLSX = require('xlsx');
const fs = require('fs');

if (fs.existsSync('test_download.xlsx')) {
    const workbook = XLSX.readFile('test_download.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // 检查年份
    const yearCell = worksheet['C3'];
    console.log('年份单元格 C3 的值:', yearCell ? yearCell.v : '无值');
    
    // 检查学校名称
    const schoolCell = worksheet['B4'];
    console.log('学校名称 B4 的值:', schoolCell ? schoolCell.v : '无值');
    
    // 打印前几行内容
    console.log('\n前10行内容:');
    for (let row = 1; row <= 10; row++) {
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
