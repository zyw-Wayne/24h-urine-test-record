// AIGC START
// TypeScript类型定义

// 检测周期状态
export type CycleStatus = 'ongoing' | 'completed'

// 检测周期
export interface TestCycle {
  id: string // 唯一ID
  startTime: string // 开始时间
  endTime?: string // 结束时间
  status: CycleStatus // 状态
  totalVolume: number // 总尿量(ml)
  urinationRecords: UrinationRecord[] // 排尿记录
  testResults?: TestResult // 检测结果
  createdAt: string // 创建时间
  updatedAt: string // 更新时间
}

// 排尿记录
export interface UrinationRecord {
  id: string
  cycleId: string
  time: string // 排尿时间
  volume: number // 尿量(ml)
  createdAt: string
}

// 检测结果
export interface TestResult {
  protein: number // 尿蛋白(mg/L)
  proteinTotal24h?: number // 24h总蛋白(g)
  creatinine: number // 肌酐(μmol/L)
  specificGravity: number // 尿比重
  ph: number // pH值
  testedAt: string // 检测时间
}

// 用户配置
export interface UserConfig {
  nickname: string
  gender?: 'male' | 'female'
  age?: number
  unit: {
    volume: 'ml' | 'l'
    protein: 'mg' | 'g'
  }
  theme: 'light' | 'dark'
}

// 备份数据格式
export interface BackupData {
  version: string
  exportTime: string
  testCycles: TestCycle[]
  userConfig: UserConfig
}
// AIGC END

