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

// 生成唯一ID（使用 Crypto API，比 Math.random 更安全且无冲突）
export const generateId = (): string => {
  return crypto.randomUUID()
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

