// 工具函数
import dayjs from 'dayjs'

// 格式化日期时间
export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format)
}

// 格式化日期
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

// 计算剩余时间
export const getRemainingTime = (startTime: string): { hours: number; minutes: number; seconds: number } => {
  const start = dayjs(startTime)
  const end = start.add(24, 'hour')
  const now = dayjs()
  const diff = end.diff(now, 'second')

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 }
  }

  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  const seconds = diff % 60

  return { hours, minutes, seconds }
}

// 生成唯一ID（优先 Crypto API，HTTP 环境回退到 Math.random）
export const generateId = (): string => {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// 根据用户配置格式化尿量显示
export const formatVolume = (ml: number, unit: 'ml' | 'l' = 'ml'): string => {
  if (unit === 'l') return `${(ml / 1000).toFixed(2)} L`
  return `${ml} ml`
}

// 根据用户配置格式化蛋白浓度
export const formatProteinConcentration = (mgPerL: number, _unit: 'mg' | 'g' = 'mg'): string => {
  // 输入值始终是 mg/L，显示单位切换不影响数值呈现方式
  return `${mgPerL} mg/L`
}

// 计算24小时总蛋白
export const calculateProteinTotal24h = (
  protein: number,
  totalVolume: number,
  volumeUnit: 'ml' | 'l' = 'ml',
): number => {
  // 统一转换为 ml
  const volumeMl = volumeUnit === 'l' ? totalVolume * 1000 : totalVolume
  // 尿蛋白浓度(mg/L) * 总尿量(L) = 总蛋白(mg)
  // 转换为g: 总蛋白(mg) / 1000
  return (protein * volumeMl) / 1000 / 1000 // mg/L * ml / 1000 / 1000 = g
}

// --- 尿常规值映射（原 constants/index.ts，移至此处以便复用） ---

// 尿常规字符串 → 数值
const ROUTINE_STRING_TO_VALUE: Record<string, number> = {
  '阴性(-)': 0,
  '阴性': 0,
  '-': 0,
  '弱阳性(±)': 0.5,
  '弱阳性': 0.5,
  '±': 0.5,
  '1+': 1,
  '++': 1,
  '2+': 2,
  '+++': 2,
  '3+': 3,
  '++++': 3,
  '4+': 4,
}

// 数值 → 显示标签
export const ROUTINE_VALUE_TO_LABEL: Record<number, string> = {
  0: '阴性(-)',
  0.5: '弱阳性(±)',
  1: '1+/++',
  2: '2+/+++',
  3: '3+/++++',
  4: '4+',
}

// 将尿常规字符串转为图表数值
export const convertRoutineValue = (value: string | undefined): number | null => {
  if (!value) return null
  const normalized = String(value).trim()
  const result = ROUTINE_STRING_TO_VALUE[normalized]
  return result !== undefined ? result : null
}

// 将图表数值转为显示标签
export const getRoutineLabel = (value: number | null): string => {
  return value !== null ? ROUTINE_VALUE_TO_LABEL[value] || '' : '无数据'
}

