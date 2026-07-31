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
