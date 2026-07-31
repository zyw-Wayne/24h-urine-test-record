import { describe, it, expect } from 'vitest'
import { getNormalRanges, isAbnormal, getCreatinineRange, getUricAcidRange } from './normalRanges'

const baseConfig = {
  nickname: '测试用户',
  unit: { volume: 'ml' as const, protein: 'mg' as const },
  theme: 'light' as const,
}

describe('getCreatinineRange', () => {
  it('男性返回 53-106', () => {
    expect(getCreatinineRange('male')).toEqual({ MIN: 53, MAX: 106 })
  })

  it('女性返回 44-97', () => {
    expect(getCreatinineRange('female')).toEqual({ MIN: 44, MAX: 97 })
  })

  it('未设置性别时默认使用女性范围（更保守）', () => {
    expect(getCreatinineRange(undefined)).toEqual({ MIN: 44, MAX: 97 })
  })
})

describe('getUricAcidRange', () => {
  it('男性返回 210-430', () => {
    expect(getUricAcidRange('male')).toEqual({ MIN: 210, MAX: 430 })
  })

  it('女性返回 150-380', () => {
    expect(getUricAcidRange('female')).toEqual({ MIN: 150, MAX: 380 })
  })
})

describe('getNormalRanges', () => {
  it('无配置时 protein24h 固定为 150', () => {
    expect(getNormalRanges().protein24h).toBe(150)
  })

  it('男性配置使用男性肌酐/尿酸范围', () => {
    const ranges = getNormalRanges({ ...baseConfig, gender: 'male' })
    expect(ranges.creatinine).toEqual({ min: 53, max: 106 })
    expect(ranges.uricAcid).toEqual({ min: 210, max: 430 })
  })

  it('女性配置使用女性肌酐/尿酸范围', () => {
    const ranges = getNormalRanges({ ...baseConfig, gender: 'female' })
    expect(ranges.creatinine).toEqual({ min: 44, max: 97 })
    expect(ranges.uricAcid).toEqual({ min: 150, max: 380 })
  })

  it('尿比重和 pH 范围不受性别影响', () => {
    const ranges = getNormalRanges({ ...baseConfig, gender: 'male' })
    expect(ranges.specificGravity).toEqual({ min: 1.003, max: 1.03 })
    expect(ranges.ph).toEqual({ min: 4.6, max: 8.0 })
  })
})

describe('isAbnormal', () => {
  it('低于下限判定异常', () => {
    expect(isAbnormal(40, 53, 106)).toBe(true)
  })

  it('高于上限判定异常', () => {
    expect(isAbnormal(120, 53, 106)).toBe(true)
  })

  it('边界值正常', () => {
    expect(isAbnormal(53, 53, 106)).toBe(false)
    expect(isAbnormal(106, 53, 106)).toBe(false)
  })

  it('范围内正常', () => {
    expect(isAbnormal(80, 53, 106)).toBe(false)
  })
})
