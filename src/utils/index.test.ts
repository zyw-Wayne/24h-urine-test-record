import { describe, it, expect } from 'vitest'
import {
  calculateProteinTotal24h,
  convertRoutineValue,
  getRoutineLabel,
  generateId,
  formatVolume,
} from './index'

describe('calculateProteinTotal24h', () => {
  it('ml 单位：蛋白 150mg/L × 尿量 1500ml = 0.225g', () => {
    expect(calculateProteinTotal24h(150, 1500)).toBeCloseTo(0.225)
  })

  it('L 单位：尿量 1.5L 自动换算为 ml 后计算', () => {
    expect(calculateProteinTotal24h(150, 1.5, 'l')).toBeCloseTo(0.225)
  })

  it('0 尿量返回 0', () => {
    expect(calculateProteinTotal24h(150, 0)).toBe(0)
  })

  it('常见病例：1000mg/L × 2000ml = 2g', () => {
    expect(calculateProteinTotal24h(1000, 2000)).toBeCloseTo(2)
  })
})

describe('convertRoutineValue', () => {
  it('映射阴性为 0', () => {
    expect(convertRoutineValue('阴性(-)')).toBe(0)
    expect(convertRoutineValue('阴性')).toBe(0)
    expect(convertRoutineValue('-')).toBe(0)
  })

  it('映射弱阳性为 0.5', () => {
    expect(convertRoutineValue('弱阳性(±)')).toBe(0.5)
    expect(convertRoutineValue('±')).toBe(0.5)
  })

  it('映射常见加号为数值', () => {
    expect(convertRoutineValue('1+')).toBe(1)
    expect(convertRoutineValue('2+')).toBe(2)
    expect(convertRoutineValue('3+')).toBe(3)
    expect(convertRoutineValue('4+')).toBe(4)
  })

  it('映射备用表示（++/+++/++++）为数值', () => {
    expect(convertRoutineValue('++')).toBe(1)
    expect(convertRoutineValue('+++')).toBe(2)
    expect(convertRoutineValue('++++')).toBe(3)
  })

  it('未知值返回 null', () => {
    expect(convertRoutineValue('不存在')).toBeNull()
  })

  it('空值返回 null', () => {
    expect(convertRoutineValue(undefined)).toBeNull()
    expect(convertRoutineValue('')).toBeNull()
  })

  it('去除首尾空格后再匹配', () => {
    expect(convertRoutineValue(' 1+ ')).toBe(1)
  })
})

describe('getRoutineLabel', () => {
  it('数值转显示标签', () => {
    expect(getRoutineLabel(0)).toBe('阴性(-)')
    expect(getRoutineLabel(1)).toBe('1+/++')
    expect(getRoutineLabel(4)).toBe('4+')
  })

  it('null 返回"无数据"', () => {
    expect(getRoutineLabel(null)).toBe('无数据')
  })

  it('未映射的数值返回空字符串', () => {
    expect(getRoutineLabel(999)).toBe('')
  })
})

describe('generateId', () => {
  it('连续生成不重复', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe('formatVolume', () => {
  it('ml 单位显示', () => {
    expect(formatVolume(1500)).toBe('1500 ml')
    expect(formatVolume(1500, 'ml')).toBe('1500 ml')
  })

  it('L 单位换算显示', () => {
    expect(formatVolume(1500, 'l')).toBe('1.50 L')
  })
})
