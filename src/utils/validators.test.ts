/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import {
  volumeRules,
  totalVolumeRules,
  protein24hRules,
  creatinineRules,
  uricAcidRules,
  uricAcidRulesOptional,
  specificGravityRules,
  phRules,
  proteinTotal24hRules,
} from './validators'

type Rule = {
  required?: boolean
  pattern?: RegExp
  message?: string
  validator?: (rule: unknown, value: any) => Promise<void>
}

/** 模拟 antd-mobile Form 校验流程，返回收集到的错误消息 */
async function validateRules(rules: Rule[], value: any): Promise<string[]> {
  const errors: string[] = []
  for (const rule of rules) {
    const isEmpty = value === undefined || value === null || value === ''
    if (rule.required && isEmpty) {
      errors.push(rule.message || '必填')
      continue
    }
    if (!isEmpty && rule.pattern && !rule.pattern.test(String(value))) {
      errors.push(rule.message || '格式错误')
      continue
    }
    if (!isEmpty && rule.validator) {
      try {
        await rule.validator(null, value)
      } catch (e: any) {
        errors.push(e.message)
      }
    }
  }
  return errors
}

describe('volumeRules', () => {
  it('空值报必填', async () => {
    expect(await validateRules(volumeRules, undefined)).toContain('请输入尿量')
  })

  it('非数字报格式错误', async () => {
    expect(await validateRules(volumeRules, 'abc')).toContain('请输入有效的数字')
  })

  it('0 报大于0错误', async () => {
    expect(await validateRules(volumeRules, '0')).toContain('数值必须大于0')
  })

  it('负数报错', async () => {
    expect(await validateRules(volumeRules, '-5')).toContain('请输入有效的数字')
  })

  it('正数通过', async () => {
    expect(await validateRules(volumeRules, '200')).toEqual([])
  })
})

describe('totalVolumeRules', () => {
  it('正数通过，0 报错', async () => {
    expect(await validateRules(totalVolumeRules, '1500')).toEqual([])
    expect(await validateRules(totalVolumeRules, '0')).toContain('数值必须大于0')
  })
})

describe('protein24hRules', () => {
  it('非负数通过，负数报错', async () => {
    expect(await validateRules(protein24hRules, '150')).toEqual([])
    expect(await validateRules(protein24hRules, '0')).toEqual([])
    expect(await validateRules(protein24hRules, '-1')).toContain('数值不能为负数')
  })
})

describe('creatinineRules', () => {
  it('非负数通过', async () => {
    expect(await validateRules(creatinineRules, '80')).toEqual([])
    expect(await validateRules(creatinineRules, '-1')).toContain('数值不能为负数')
  })
})

describe('uricAcidRules / uricAcidRulesOptional', () => {
  it('必填版空值报错', async () => {
    expect(await validateRules(uricAcidRules, undefined)).toContain('请输入尿酸')
  })

  it('可选版空值通过（旧记录编辑兼容）', async () => {
    expect(await validateRules(uricAcidRulesOptional, undefined)).toEqual([])
  })

  it('有效值均通过', async () => {
    expect(await validateRules(uricAcidRules, '300')).toEqual([])
    expect(await validateRules(uricAcidRulesOptional, '300')).toEqual([])
  })
})

describe('specificGravityRules', () => {
  it('在 1.000-1.050 范围内通过', async () => {
    expect(await validateRules(specificGravityRules, '1.020')).toEqual([])
    expect(await validateRules(specificGravityRules, '1.000')).toEqual([])
    expect(await validateRules(specificGravityRules, '1.050')).toEqual([])
  })

  it('超出范围报错', async () => {
    expect(await validateRules(specificGravityRules, '1.100')).toContain('尿比重应在1.000-1.050之间')
    expect(await validateRules(specificGravityRules, '0.900')).toContain('尿比重应在1.000-1.050之间')
  })
})

describe('phRules', () => {
  it('在 0-14 范围内通过', async () => {
    expect(await validateRules(phRules, '7')).toEqual([])
    expect(await validateRules(phRules, '0')).toEqual([])
    expect(await validateRules(phRules, '14')).toEqual([])
  })

  it('超出范围报错', async () => {
    expect(await validateRules(phRules, '15')).toContain('pH值应在0-14之间')
  })
})

describe('proteinTotal24hRules', () => {
  it('非必填，空值通过', async () => {
    expect(await validateRules(proteinTotal24hRules, undefined)).toEqual([])
  })

  it('负数报错，正数通过', async () => {
    expect(await validateRules(proteinTotal24hRules, '0.22')).toEqual([])
    expect(await validateRules(proteinTotal24hRules, '-0.1')).toContain('数值不能为负数')
  })
})
