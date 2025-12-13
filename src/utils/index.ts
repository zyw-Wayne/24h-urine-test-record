// AIGC START
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

// 生成唯一ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// 验证数值范围
export const validateRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max
}

// 计算24小时总蛋白
export const calculateProteinTotal24h = (protein: number, totalVolume: number): number => {
  // 尿蛋白浓度(mg/L) * 总尿量(L) = 总蛋白(mg)
  // 转换为g: 总蛋白(mg) / 1000
  return (protein * totalVolume) / 1000 / 1000 // mg/L * ml / 1000 / 1000 = g
}
// AIGC END

