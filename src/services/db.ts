// AIGC START
// IndexedDB数据库操作
import Dexie, { Table } from 'dexie'
import type { TestCycle, UrinationRecord, UserConfig } from '@/types'
import { generateId } from '@/utils'

class UrineTestDatabase extends Dexie {
  testCycles!: Table<TestCycle>
  urinationRecords!: Table<UrinationRecord>
  userConfig!: Table<UserConfig>

  constructor() {
    super('UrineTestDB')
    this.version(1).stores({
      testCycles: 'id, startTime, status, createdAt',
      urinationRecords: 'id, cycleId, time, createdAt',
      userConfig: 'id',
    })
  }
}

const db = new UrineTestDatabase()

// 检测周期相关操作
export const cycleService = {
  // 获取所有检测周期
  async getAll(): Promise<TestCycle[]> {
    const cycles = await db.testCycles.orderBy('createdAt').reverse().toArray()
    // 加载每个周期的排尿记录
    for (const cycle of cycles) {
      cycle.urinationRecords = await db.urinationRecords
        .where('cycleId')
        .equals(cycle.id)
        .sortBy('time')
    }
    return cycles
  },

  // 获取进行中的检测周期
  async getOngoing(): Promise<TestCycle | null> {
    const cycle = await db.testCycles.where('status').equals('ongoing').first()
    if (cycle) {
      cycle.urinationRecords = await db.urinationRecords
        .where('cycleId')
        .equals(cycle.id)
        .sortBy('time')
    }
    return cycle || null
  },

  // 根据ID获取检测周期
  async getById(id: string): Promise<TestCycle | null> {
    const cycle = await db.testCycles.get(id)
    if (cycle) {
      cycle.urinationRecords = await db.urinationRecords
        .where('cycleId')
        .equals(cycle.id)
        .sortBy('time')
    }
    return cycle || null
  },

  // 创建新的检测周期
  async create(cycle: Omit<TestCycle, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestCycle> {
    const now = new Date().toISOString()
    const newCycle: TestCycle = {
      ...cycle,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    await db.testCycles.add(newCycle)
    return newCycle
  },

  // 更新检测周期
  async update(id: string, updates: Partial<TestCycle>): Promise<void> {
    await db.testCycles.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  },

  // 删除检测周期
  async delete(id: string): Promise<void> {
    // 同时删除相关的排尿记录
    await db.urinationRecords.where('cycleId').equals(id).delete()
    await db.testCycles.delete(id)
  },

  // 删除所有检测周期
  async deleteAll(): Promise<void> {
    await db.urinationRecords.clear()
    await db.testCycles.clear()
  },
}

// 排尿记录相关操作
export const urinationService = {
  // 添加排尿记录
  async add(record: Omit<UrinationRecord, 'id' | 'createdAt'>): Promise<UrinationRecord> {
    // AIGC START
    const newRecord: UrinationRecord = {
      ...record,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    await db.urinationRecords.add(newRecord)

    // 更新周期的总尿量：从数据库重新读取该周期下的所有记录并计算总和
    const allRecords = await db.urinationRecords
      .where('cycleId')
      .equals(record.cycleId)
      .toArray()
    const totalVolume = allRecords.reduce((sum, r) => sum + r.volume, 0)
    await cycleService.update(record.cycleId, { totalVolume })
    // AIGC END

    return newRecord
  },

  // 更新排尿记录
  async update(id: string, updates: Partial<UrinationRecord>): Promise<void> {
    // AIGC START
    await db.urinationRecords.update(id, updates)

    // 更新周期的总尿量：从数据库重新读取该周期下的所有记录并计算总和
    const record = await db.urinationRecords.get(id)
    if (record) {
      const allRecords = await db.urinationRecords
        .where('cycleId')
        .equals(record.cycleId)
        .toArray()
      const totalVolume = allRecords.reduce((sum, r) => sum + r.volume, 0)
      await cycleService.update(record.cycleId, { totalVolume })
    }
    // AIGC END
  },

  // 删除排尿记录
  async delete(id: string): Promise<void> {
    // AIGC START
    const record = await db.urinationRecords.get(id)
    if (record) {
      await db.urinationRecords.delete(id)

      // 更新周期的总尿量：从数据库重新读取该周期下的所有记录并计算总和
      const allRecords = await db.urinationRecords
        .where('cycleId')
        .equals(record.cycleId)
        .toArray()
      const totalVolume = allRecords.reduce((sum, r) => sum + r.volume, 0)
      await cycleService.update(record.cycleId, { totalVolume })
    }
    // AIGC END
  },
}

// 用户配置相关操作
export const configService = {
  // 获取用户配置
  async get(): Promise<UserConfig | null> {
    const config = await db.userConfig.toCollection().first()
    if (config) {
      const { id, ...userConfig } = config as UserConfig & { id: string }
      return userConfig
    }
    return null
  },

  // 保存用户配置
  async save(config: UserConfig): Promise<void> {
    const existing = await db.userConfig.toCollection().first()
    if (existing) {
      await db.userConfig.update('default', config)
    } else {
      await db.userConfig.add({ ...config, id: 'default' } as UserConfig & { id: string })
    }
  },
}

export default db
// AIGC END

