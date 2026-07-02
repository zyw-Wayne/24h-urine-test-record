// 表单校验规则 — 统一校验逻辑，消除 Record/History 之间的重复定义

/** 通用数字格式正则 */
const NUMBER_PATTERN = /^\d+(\.\d+)?$/

/** 必填 + 数字格式 */
export const requiredNumber = {
  required: true as const,
  pattern: NUMBER_PATTERN,
  message: '请输入有效的数字',
}

/** 数字格式（非必填） */
export const optionalNumber = {
  pattern: NUMBER_PATTERN,
  message: '请输入有效的数字',
}

/** 值必须 > 0 */
export const positiveValidator = {
  validator: (_: unknown, value: string | undefined) => {
    if (!value || Number(value) > 0) {
      return Promise.resolve()
    }
    return Promise.reject(new Error('数值必须大于0'))
  },
}

/** 值必须 >= 0（可为0） */
export const nonNegativeValidator = {
  validator: (_: unknown, value: string | undefined) => {
    if (!value || Number(value) >= 0) {
      return Promise.resolve()
    }
    return Promise.reject(new Error('数值不能为负数'))
  },
}

/** 尿量字段校验规则 */
export const volumeRules = [
  { required: true, message: '请输入尿量' },
  requiredNumber,
  positiveValidator,
]

/** 总尿量字段校验规则 */
export const totalVolumeRules = [
  { required: true, message: '请输入总尿量' },
  requiredNumber,
  positiveValidator,
]

/** 24H尿蛋白定量校验规则 */
export const protein24hRules = [
  { required: true, message: '请输入24H尿蛋白定量' },
  requiredNumber,
  nonNegativeValidator,
]

/** 肌酐校验规则 */
export const creatinineRules = [
  { required: true, message: '请输入肌酐' },
  requiredNumber,
  nonNegativeValidator,
]

/** 尿酸校验规则 */
export const uricAcidRules = [
  { required: true, message: '请输入尿酸' },
  requiredNumber,
  nonNegativeValidator,
]

/** 尿酸校验规则（旧记录编辑时使用，无 required） */
export const uricAcidRulesOptional = [
  { required: false },
  requiredNumber,
  nonNegativeValidator,
]

/** 尿比重校验规则 */
export const specificGravityRules = [
  { required: true, message: '请输入尿比重' },
  requiredNumber,
  {
    validator: (_: unknown, value: string | undefined) => {
      const num = Number(value)
      if (!value || (num >= 1.000 && num <= 1.050)) {
        return Promise.resolve()
      }
      return Promise.reject(new Error('尿比重应在1.000-1.050之间'))
    },
  },
]

/** pH值校验规则 */
export const phRules = [
  { required: true, message: '请输入pH值' },
  requiredNumber,
  {
    validator: (_: unknown, value: string | undefined) => {
      const num = Number(value)
      if (!value || (num >= 0 && num <= 14)) {
        return Promise.resolve()
      }
      return Promise.reject(new Error('pH值应在0-14之间'))
    },
  },
]

/** 24小时总蛋白量校验规则（非必填） */
export const proteinTotal24hRules = [
  { required: false },
  optionalNumber,
  nonNegativeValidator,
]
