// AIGC START
// 备份和恢复功能
import { saveAs } from 'file-saver'
import type { BackupData, TestCycle, UrinationRecord } from '@/types'
import { BACKUP_VERSION } from '@/constants'
import { cycleService, configService } from './db'
import { formatDateTime } from '@/utils'

// 导出备份
export const exportBackup = async (): Promise<void> => {
  const cycles = await cycleService.getAll()
  const config = await configService.get()

  const backupData: BackupData = {
    version: BACKUP_VERSION,
    exportTime: new Date().toISOString(),
    testCycles: cycles,
    userConfig: config || {
      nickname: '用户',
      unit: { volume: 'ml', protein: 'mg' },
      theme: 'light',
    },
  }

  const jsonStr = JSON.stringify(backupData, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const fileName = `24h_urine_test_backup_${formatDateTime(new Date(), 'YYYY-MM-DD_HH-mm-ss')}.json`
  saveAs(blob, fileName)
}

// 导入备份
export const importBackup = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const backupData: BackupData = JSON.parse(text)

        // 验证备份数据格式
        if (!backupData.version || !backupData.testCycles || !backupData.userConfig) {
          throw new Error('备份文件格式不正确')
        }

        // 清空现有数据
        await cycleService.deleteAll()

        // 恢复数据
        const { default: db } = await import('./db')
        for (const cycle of backupData.testCycles) {
          // 保存排尿记录以便后续恢复
          const records = cycle.urinationRecords || []
          const { urinationRecords, ...cycleData } = cycle
          
          // 直接添加到数据库（保留原始ID和时间戳）
          const cycleToRestore: TestCycle = {
            ...cycleData,
            urinationRecords: [], // 先设为空，后面单独恢复
          }
          await db.testCycles.add(cycleToRestore)
          
          // 恢复排尿记录
          for (const record of records) {
            const recordToRestore: UrinationRecord = {
              ...record,
            }
            await db.urinationRecords.add(recordToRestore)
          }
          
          // 重新计算总尿量
          const totalVolume = records.reduce((sum, r) => sum + r.volume, 0)
          await cycleService.update(cycle.id, { totalVolume })
        }

        // 恢复用户配置
        await configService.save(backupData.userConfig)

        resolve()
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }

    reader.readAsText(file)
  })
}
// AIGC END

