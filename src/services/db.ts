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
    return this._batchLoadRecords(
      await db.testCycles.orderBy('createdAt').reverse().toArray()
    )
  },

  // 获取指定时间范围之后的检测周期（在数据库侧过滤，避免拉取全量数据）
  async getByTimeRange(since: string): Promise<TestCycle[]> {
    return this._batchLoadRecords(
      await db.testCycles.where('createdAt').above(since).reverse().toArray()
    )
  },

  // 内部：批量加载排尿记录并赋值给周期列表（复用逻辑）
  async _batchLoadRecords(cycles: TestCycle[]): Promise<TestCycle[]> {
    if (cycles.length === 0) return cycles

    const cycleIds = cycles.map(c => c.id)
    const allRecords = await db.urinationRecords
      .where('cycleId')
      .anyOf(cycleIds)
      .sortBy('time')

    const recordsByCycleId = new Map<string, UrinationRecord[]>()
    for (const record of allRecords) {
      const group = recordsByCycleId.get(record.cycleId) || []
      group.push(record)
      recordsByCycleId.set(record.cycleId, group)
    }

    for (const cycle of cycles) {
      cycle.urinationRecords = recordsByCycleId.get(cycle.id) || []
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
    const { urinationRecords, ...cycleData } = cycle
    const newCycle: TestCycle = {
      ...cycleData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      urinationRecords: [],
    }
    // 写入 IndexedDB 时排除 urinationRecords（运行时字段，不持久化）
    const { urinationRecords: _, ...rest } = newCycle
    await db.testCycles.add(rest as TestCycle)
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
    const newRecord: UrinationRecord = {
      ...record,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }

    // 使用 Dexie 事务包裹写+读+更新，防止并发写入时总尿量被陈旧值覆盖
    await db.transaction('rw', db.urinationRecords, db.testCycles, async () => {
      await db.urinationRecords.add(newRecord)

      const allRecords = await db.urinationRecords
        .where('cycleId')
        .equals(record.cycleId)
        .toArray()
      const totalVolume = allRecords.reduce((sum, r) => sum + r.volume, 0)
      await db.testCycles.update(record.cycleId, {
        totalVolume,
        updatedAt: new Date().toISOString(),
      })
    })

    return newRecord
  },

  // 更新排尿记录
  async update(id: string, updates: Partial<UrinationRecord>): Promise<void> {
    // 使用事务保证原子性
    await db.transaction('rw', db.urinationRecords, db.testCycles, async () => {
      await db.urinationRecords.update(id, updates)

      const record = await db.urinationRecords.get(id)
      if (record) {
        const allRecords = await db.urinationRecords
          .where('cycleId')
          .equals(record.cycleId)
          .toArray()
        const totalVolume = allRecords.reduce((sum, r) => sum + r.volume, 0)
        await db.testCycles.update(record.cycleId, {
          totalVolume,
          updatedAt: new Date().toISOString(),
        })
      }
    })
  },

  // 删除排尿记录
  async delete(id: string): Promise<void> {
    // 使用事务保证原子性
    await db.transaction('rw', db.urinationRecords, db.testCycles, async () => {
      const record = await db.urinationRecords.get(id)
      if (record) {
        await db.urinationRecords.delete(id)

        const allRecords = await db.urinationRecords
          .where('cycleId')
          .equals(record.cycleId)
          .toArray()
        const totalVolume = allRecords.reduce((sum, r) => sum + r.volume, 0)
        await db.testCycles.update(record.cycleId, {
          totalVolume,
          updatedAt: new Date().toISOString(),
        })
      }
    })
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
      // 使用实际主键更新，而非硬编码 'default'
      await db.userConfig.update((existing as UserConfig & { id: string }).id, config)
    } else {
      await db.userConfig.add({ ...config, id: 'default' } as UserConfig & { id: string })
    }
  },
}

export default db

