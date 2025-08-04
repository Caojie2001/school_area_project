const XLSX = require('xlsx');
const fs = require('fs');

if (fs.existsSync('test_batch_real.xlsx')) {
    const workbook = XLSX.readFile('test_batch_real.xlsx');
    console.log('工作表:', workbook.SheetNames);
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // 获取表头
    console.log('\n第一个工作表的表头（第1行）:');
    const headers = [];
    for (let col = 0; col < 10; col++) {
        const cellAddress = XLSX.utils.encode_cell({r: 0, c: col});
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
            headers.push(`${String.fromCharCode(65 + col)}: ${cell.v}`);
        }
    }
    console.log(headers);
    
    // 查找年份列
    const yearColIndex = Object.keys(worksheet).find(key => {
        const cell = worksheet[key];
        return cell && cell.v && (cell.v.toString().includes('统计年份') || cell.v.toString().includes('年份'));
    });
    
    if (yearColIndex) {
        console.log(`\n找到年份列: ${yearColIndex}`);
        const col = XLSX.utils.decode_cell(yearColIndex).c;
        
        // 显示前几行的年份数据
        for (let row = 1; row <= 5; row++) {
            const cellAddress = XLSX.utils.encode_cell({r: row, c: col});
            const cell = worksheet[cellAddress];
            if (cell) {
                console.log(`第${row + 1}行年份:`, cell.v);
            }
        }
    } else {
        console.log('\n未找到年份列');
    }
} else {
    console.log('批量下载文件不存在');
}
