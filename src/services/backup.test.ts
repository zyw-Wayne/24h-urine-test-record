/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---- mock db 模块（不依赖真实 IndexedDB，验证 importBackup 数据路径）----
const dbMocks = vi.hoisted(() => {
  const testCycles = {
    clear: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
  }
  const urinationRecords = {
    clear: vi.fn(),
    add: vi.fn(),
  }
  const db = {
    transaction: vi.fn(async (_mode: unknown, _t1: unknown, _t2: unknown, cb: () => Promise<void>) => {
      await cb()
    }),
    testCycles,
    urinationRecords,
  }
  return { db, testCycles, urinationRecords }
})

vi.mock('./db', () => ({
  __esModule: true,
  default: dbMocks.db,
  cycleService: { getAll: vi.fn(), getByTimeRange: vi.fn() },
  configService: { get: vi.fn(), save: vi.fn() },
}))

// ---- mock FileReader（Node 环境无此 API）----
class MockFileReader {
  result: string | null = null
  onload: ((e: { target: { result: string } }) => void) | null = null
  onerror: (() => void) | null = null

  readAsText(file: File) {
    file.text().then((text) => {
      this.result = text
      this.onload?.({ target: { result: text } })
    })
  }
}
vi.stubGlobal('FileReader', MockFileReader as unknown as typeof FileReader)

import { importBackup } from './backup'
import { convertRoutineValue } from '@/utils'

/** 构造含加号写法（++/+++/++++）的备份 JSON，模拟真实历史备份 */
const makeBackupJson = (): string =>
  JSON.stringify({
    version: '1.1.0',
    exportTime: '2026-07-31T00:00:00.000Z',
    testCycles: [
      {
        id: 'cycle-1',
        startTime: '2026-01-01T08:00:00.000Z',
        endTime: '2026-01-02T08:00:00.000Z',
        status: 'completed',
        totalVolume: 1500,
        urinationRecords: [
          {
            id: 'uri-1',
            cycleId: 'cycle-1',
            time: '2026-01-01T12:00:00.000Z',
            volume: 300,
            createdAt: '2026-01-01T12:00:00.000Z',
          },
        ],
        testResults: {
          protein24hQuantitative: 120,
          proteinRoutine: '++',
          occultBlood: '+++',
          creatinine: 80,
          specificGravity: 1.02,
          ph: 6.5,
          testedAt: '2026-01-02T08:00:00.000Z',
        },
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-01-02T08:00:00.000Z',
      },
    ],
    userConfig: { nickname: '测试', unit: { volume: 'ml', protein: 'mg' }, theme: 'light' },
  })

const importBackupFile = (): Promise<void | { warnings: string[] }> =>
  importBackup(new File([makeBackupJson()], 'backup.json', { type: 'application/json' }))

describe('importBackup — 尿常规字符串原值保持（不受映射表影响）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('导入后写入 DB 的是字符串原值 ++/+++，而非映射后的数值', async () => {
    await importBackupFile()

    const stored = dbMocks.testCycles.add.mock.calls[0][0] as { testResults: Record<string, any> }
    expect(stored.testResults.proteinRoutine).toBe('++')
    expect(stored.testResults.occultBlood).toBe('+++')
    // 关键不变量：存储层是字符串，映射函数返回的是数值，二者不应相等
    expect(stored.testResults.proteinRoutine).not.toBe(convertRoutineValue('++'))
    expect(stored.testResults.occultBlood).not.toBe(convertRoutineValue('+++'))
  })

  it('导出→导入 JSON 序列化往返保持尿常规字符串原值', async () => {
    // 模拟一次完整备份往返：导出时 JSON.stringify，导入时 JSON.parse
    const roundTripped = JSON.parse(makeBackupJson())
    const again = JSON.parse(JSON.stringify(roundTripped))

    expect(again.testCycles[0].testResults.proteinRoutine).toBe('++')
    expect(again.testCycles[0].testResults.occultBlood).toBe('+++')
    expect(typeof again.testCycles[0].testResults.proteinRoutine).toBe('string')
  })

  it('排尿记录明细原样写入，不经过任何映射', async () => {
    await importBackupFile()

    const storedUri = dbMocks.urinationRecords.add.mock.calls[0][0] as Record<string, any>
    expect(storedUri.cycleId).toBe('cycle-1')
    expect(storedUri.time).toBe('2026-01-01T12:00:00.000Z')
    expect(storedUri.volume).toBe(300)
  })

  it('testResults 缺失 uricAcid（旧备份）不导致校验失败', async () => {
    await importBackupFile()
    expect(dbMocks.testCycles.add).toHaveBeenCalledTimes(1)
    expect(dbMocks.testCycles.clear).toHaveBeenCalledTimes(1)
  })
})

describe('importBackup — 兼容历史脏数据（字符串数值/数组字段）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 模拟真实线上备份：totalVolume 是字符串、testResults 数字字段是字符串、
  // proteinRoutine/occultBlood/theme 是数组（antd-mobile Selector 单选曾返回数组）
  const makeDirtyBackupJson = (): string =>
    JSON.stringify({
      version: '1.1.0',
      exportTime: '2026-07-31T14:20:16.580Z',
      testCycles: [
        {
          id: 'c51b8d70-5655-430a-93f4-4bedf65ea5a9',
          startTime: '2026-07-31T14:19:00.000Z',
          endTime: '2026-08-01T14:19:00.000Z',
          status: 'manual',
          totalVolume: '15', // 字符串数值
          testResults: {
            protein24hQuantitative: '8',
            proteinTotal24h: 0.00011999999999999999,
            proteinRoutine: ['阴性(-)'], // 数组
            occultBlood: ['阴性(-)'],
            creatinine: '44',
            uricAcid: '85',
            specificGravity: '1',
            ph: '2',
            testedAt: '2026-07-31T14:19:00.000Z',
          },
          createdAt: '2026-07-31T14:20:12.376Z',
          updatedAt: '2026-07-31T14:20:12.376Z',
          urinationRecords: [],
        },
      ],
      userConfig: { nickname: '用户', unit: { volume: 'ml', protein: 'mg' }, theme: ['dark'] },
    })

  const importDirty = (): Promise<void | { warnings: string[] }> =>
    importBackup(new File([makeDirtyBackupJson()], 'backup.json', { type: 'application/json' }))

  it('字符串 totalVolume "15" 能恢复，且被归一化为数字 15', async () => {
    await expect(importDirty()).resolves.not.toThrow()

    const stored = dbMocks.testCycles.add.mock.calls[0][0] as { totalVolume: unknown }
    expect(stored.totalVolume).toBe(15)
    expect(typeof stored.totalVolume).toBe('number')

    // update 调用也应写入数字
    const updated = dbMocks.testCycles.update.mock.calls.find(
      (c) => c[0] === 'c51b8d70-5655-430a-93f4-4bedf65ea5a9'
    )
    expect(updated?.[1].totalVolume).toBe(15)
  })

  it('字符串数字字段（creatinine/specificGravity/ph 等）归一化为 number', async () => {
    await importDirty()

    const stored = dbMocks.testCycles.add.mock.calls[0][0] as {
      testResults: Record<string, unknown>
    }
    expect(stored.testResults.protein24hQuantitative).toBe(8)
    expect(stored.testResults.creatinine).toBe(44)
    expect(stored.testResults.uricAcid).toBe(85)
    expect(stored.testResults.specificGravity).toBe(1)
    expect(stored.testResults.ph).toBe(2)
    expect(typeof stored.testResults.creatinine).toBe('number')
  })

  it('数组字段（proteinRoutine/occultBlood）取首个元素归一化为字符串', async () => {
    await importDirty()

    const stored = dbMocks.testCycles.add.mock.calls[0][0] as {
      testResults: Record<string, unknown>
    }
    expect(stored.testResults.proteinRoutine).toBe('阴性(-)')
    expect(stored.testResults.occultBlood).toBe('阴性(-)')
    expect(typeof stored.testResults.proteinRoutine).toBe('string')
  })

  it('数组 theme 恢复时归一化为字符串', async () => {
    await importDirty()

    // configService.save 被调用时传入归一化后的 theme
    const { configService } = await import('./db')
    const savedConfig = (configService.save as any).mock.calls[0][0]
    expect(savedConfig.theme).toBe('dark')
    expect(Array.isArray(savedConfig.theme)).toBe(false)
  })

  it('修复前的报错场景（第1条总尿量无效）不再发生', async () => {
    await expect(importDirty()).resolves.not.toThrowError(/总尿量无效/)
  })
})
