// 数据导出功能
import * as XLSX from 'xlsx'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { formatDateTime } from '@/utils'
import { cycleService } from './db'

// 导出为Excel
export const exportToExcel = async (): Promise<void> => {
  const cycles = await cycleService.getAll()

  // Sheet 1：检测周期
  const cycleSheetData: Record<string, string | number>[] = cycles.map((cycle) => ({
    周期ID: cycle.id,
    开始时间: formatDateTime(cycle.startTime),
    结束时间: cycle.endTime ? formatDateTime(cycle.endTime) : '未结束',
    状态: cycle.status === 'ongoing' ? '进行中' : cycle.status === 'manual' ? '手动录入' : '已完成',
    总尿量: `${cycle.totalVolume} ml`,
    '24H尿蛋白定量': cycle.testResults?.protein24hQuantitative ? `${cycle.testResults.protein24hQuantitative} mg/L` : '',
    '24h总蛋白': cycle.testResults?.proteinTotal24h
      ? `${cycle.testResults.proteinTotal24h.toFixed(2)} g`
      : '',
    尿常规尿蛋白: cycle.testResults?.proteinRoutine || '',
    尿常规潜血: cycle.testResults?.occultBlood || '',
    肌酐: cycle.testResults?.creatinine ? `${cycle.testResults.creatinine} μmol/L` : '',
    尿酸: cycle.testResults?.uricAcid ? `${cycle.testResults.uricAcid} μmol/L` : '',
    尿比重: cycle.testResults?.specificGravity || '',
    pH值: cycle.testResults?.ph || '',
    排尿次数: cycle.urinationRecords.length,
  }))

  // Sheet 2：排尿记录详情
  const urinationSheetData: Record<string, string | number>[] = []
  cycles.forEach((cycle) => {
    cycle.urinationRecords.forEach((record, index) => {
      urinationSheetData.push({
        周期ID: cycle.id,
        开始时间: formatDateTime(cycle.startTime),
        排尿序号: index + 1,
        排尿时间: formatDateTime(record.time),
        尿量: `${record.volume} ml`,
      })
    })
  })

  // 创建工作簿
  const wb = XLSX.utils.book_new()

  // Sheet 1
  const cycleWs = XLSX.utils.json_to_sheet(cycleSheetData)
  cycleWs['!cols'] = [
    { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
    { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 10 }, { wch: 10 },
    { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, cycleWs, '检测周期')

  // Sheet 2
  if (urinationSheetData.length > 0) {
    const urinationWs = XLSX.utils.json_to_sheet(urinationSheetData)
    urinationWs['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 10 },
      { wch: 20 }, { wch: 12 },
    ]
    XLSX.utils.book_append_sheet(wb, urinationWs, '排尿记录')
  }

  // 导出文件（先写入缓存，再通过分享让用户选择保存位置）
  const fileName = `24小时尿蛋白检测记录_${formatDateTime(new Date(), 'YYYY-MM-DD_HH-mm-ss')}.xlsx`
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const base64Data = arrayBufferToBase64(excelBuffer)

  await Filesystem.writeFile({
    path: fileName,
    data: base64Data,
    directory: Directory.Cache,
  });

  const fileUri = await Filesystem.getUri({
    path: fileName,
    directory: Directory.Cache,
  });

  await Share.share({
    title: '导出Excel',
    text: '24小时尿蛋白检测记录',
    url: fileUri.uri,
    files: [fileUri.uri],
    dialogTitle: '保存Excel文件到',
  });
}

/**
 * ArrayBuffer 转为 Base64 字符串
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

