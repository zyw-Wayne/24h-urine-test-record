// AIGC START
// 数据导出功能
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { formatDateTime } from '@/utils'
import { cycleService } from './db'

// 导出为Excel
export const exportToExcel = async (): Promise<void> => {
  const cycles = await cycleService.getAll()

  // 准备数据
  const data: any[] = []

  cycles.forEach((cycle) => {
    // 周期基本信息
    data.push({
      周期ID: cycle.id,
      开始时间: formatDateTime(cycle.startTime),
      结束时间: cycle.endTime ? formatDateTime(cycle.endTime) : '未结束',
      状态: cycle.status === 'ongoing' ? '进行中' : '已完成',
      总尿量: `${cycle.totalVolume} ml`,
      尿蛋白: cycle.testResults?.protein ? `${cycle.testResults.protein} mg/L` : '',
      '24h总蛋白': cycle.testResults?.proteinTotal24h
        ? `${cycle.testResults.proteinTotal24h.toFixed(2)} g`
        : '',
      肌酐: cycle.testResults?.creatinine ? `${cycle.testResults.creatinine} μmol/L` : '',
      尿比重: cycle.testResults?.specificGravity || '',
      pH值: cycle.testResults?.ph || '',
      排尿次数: cycle.urinationRecords.length,
    })

    // 排尿记录详情
    if (cycle.urinationRecords.length > 0) {
      cycle.urinationRecords.forEach((record, index) => {
        data.push({
          周期ID: '',
          开始时间: '',
          结束时间: '',
          状态: '',
          总尿量: '',
          尿蛋白: '',
          '24h总蛋白': '',
          肌酐: '',
          尿比重: '',
          pH值: '',
          排尿次数: `第${index + 1}次`,
          排尿时间: formatDateTime(record.time),
          尿量: `${record.volume} ml`,
        })
      })
    }

    // 空行分隔
    data.push({})
  })

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // 设置列宽
  const colWidths = [
    { wch: 20 }, // 周期ID
    { wch: 20 }, // 开始时间
    { wch: 20 }, // 结束时间
    { wch: 10 }, // 状态
    { wch: 12 }, // 总尿量
    { wch: 15 }, // 尿蛋白
    { wch: 15 }, // 24h总蛋白
    { wch: 15 }, // 肌酐
    { wch: 10 }, // 尿比重
    { wch: 10 }, // pH值
    { wch: 12 }, // 排尿次数
    { wch: 20 }, // 排尿时间
    { wch: 12 }, // 尿量
  ]
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, '检测记录')

  // 导出文件
  const fileName = `24小时尿蛋白检测记录_${formatDateTime(new Date(), 'YYYY-MM-DD_HH-mm-ss')}.xlsx`
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, fileName)
}
// AIGC END

