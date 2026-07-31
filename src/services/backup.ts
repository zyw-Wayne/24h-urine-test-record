// 备份和恢复功能
import dayjs from 'dayjs'
import type { BackupData } from '@/types'
import { BACKUP_VERSION } from '@/constants'
import db, { cycleService, configService } from './db'
import { saveFile, type SaveFileResult } from './fileSave'
import { formatDateTime } from '@/utils'

// 导出备份（返回文件实际保存方式，供调用方展示准确提示）
export const exportBackup = async (): Promise<SaveFileResult> => {
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
  const fileName = `24h_urine_test_backup_${formatDateTime(new Date(), 'YYYY-MM-DD_HH-mm-ss')}.json`

  return saveFile(fileName, jsonStr, 'application/json')
}

// 导入备份（使用事务保证原子性：失败时自动回滚）
export const importBackup = async (file: File): Promise<{ warnings: string[] } | void> => {
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

        // 在事务中清空 + 恢复，中途失败自动回滚
        await db.transaction('rw', db.testCycles, db.urinationRecords, async () => {
          await db.testCycles.clear()
          await db.urinationRecords.clear()

          // 逐条校验数据格式，防止脏备份文件导致页面崩溃
          const VALID_STATUSES = ['ongoing', 'completed', 'manual'] as string[]
          for (const [index, cycle] of backupData.testCycles.entries()) {
            const recordNo = index + 1
            if (!cycle || typeof cycle !== 'object') {
              throw new Error(`备份文件第 ${recordNo} 条记录无效`)
            }
            if (!cycle.id || typeof cycle.id !== 'string') {
              throw new Error(`备份文件第 ${recordNo} 条记录缺少有效的周期 ID`)
            }
            // 先确认是 string 再校验，dayjs(undefined) 会被当作当前时间而通过校验
            if (typeof cycle.startTime !== 'string' || !dayjs(cycle.startTime).isValid()) {
              throw new Error(`备份文件第 ${recordNo} 条记录的开始时间无效`)
            }
            if (typeof cycle.totalVolume !== 'number' || !isFinite(cycle.totalVolume)) {
              throw new Error(`备份文件第 ${recordNo} 条记录的总尿量无效`)
            }
            if (!VALID_STATUSES.includes(cycle.status)) {
              throw new Error(`备份文件第 ${recordNo} 条记录的状态无效`)
            }

            const records = cycle.urinationRecords || []
            const { urinationRecords, ...cycleData } = cycle

            // 校验排尿记录明细
            for (const [rIndex, record] of records.entries()) {
              if (
                !record ||
                !record.id ||
                !record.cycleId ||
                typeof record.time !== 'string' ||
                !dayjs(record.time).isValid() ||
                typeof record.volume !== 'number' ||
                !isFinite(record.volume)
              ) {
                throw new Error(`备份文件第 ${recordNo} 条记录的排尿明细（第 ${rIndex + 1} 条）无效`)
              }
            }

            // 直接添加到数据库（保留原始ID和时间戳）
            await db.testCycles.add({
              ...cycleData,
              urinationRecords: [],
              updatedAt: new Date().toISOString(),
            })

            // 恢复排尿记录
            for (const record of records) {
              await db.urinationRecords.add(record)
            }

            // 使用备份中原有的总尿量值，避免重复计算
            // totalVolume 已在备份数据中保存，直接使用 cycle.totalVolume
            await db.testCycles.update(cycle.id, { totalVolume: cycleData.totalVolume })
          }
        })

        // 检测旧版备份中缺尿酸的记录
        const missingUricAcidCount = backupData.testCycles.filter(
          (c) => c.testResults && c.testResults.uricAcid === undefined
        ).length

        const warnings: string[] = []
        if (missingUricAcidCount > 0) {
          warnings.push(`有 ${missingUricAcidCount} 条旧记录缺少尿酸数据，编辑时可选填`)
        }

        // 恢复用户配置（独立事务，不影响主数据恢复）
        await configService.save(backupData.userConfig)

        resolve(warnings.length > 0 ? { warnings } : undefined)
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

