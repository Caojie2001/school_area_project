#!/bin/bash

echo "=== 统计分析页面功能测试 ==="
echo

echo "1. 测试统计API..."
curl -s "http://localhost:3000/api/statistics" | jq '.success'

echo "2. 测试年份API..."
curl -s "http://localhost:3000/api/years" | jq '.success'

echo "3. 测试学校数据API..."
curl -s "http://localhost:3000/api/schools/latest" | jq '.success'

echo "4. 检查页面是否包含统计分析模块..."
if curl -s "http://localhost:3000" | grep -q "统计分析页面"; then
    echo "✓ 统计分析页面存在"
else
    echo "✗ 统计分析页面不存在"
fi

echo "5. 检查是否移除了数据导出模块..."
if curl -s "http://localhost:3000" | grep -q "数据导出"; then
    echo "✗ 数据导出模块仍然存在"
else
    echo "✓ 数据导出模块已移除"
fi

echo
echo "=== 测试完成 ==="
