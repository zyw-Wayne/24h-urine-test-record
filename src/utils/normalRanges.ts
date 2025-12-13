// AIGC START
// 正常值范围工具函数
import type { UserConfig } from '@/types'
import { NORMAL_RANGES_COMMON, NORMAL_RANGES_CREATININE } from '@/constants'

/**
 * 根据用户性别获取肌酐正常值范围
 */
export const getCreatinineRange = (gender?: 'male' | 'female') => {
  if (gender === 'male') {
    return NORMAL_RANGES_CREATININE.MALE
  }
  // 默认使用女性范围（更保守）
  return NORMAL_RANGES_CREATININE.FEMALE
}

/**
 * 获取所有正常值范围（根据用户配置）
 */
export const getNormalRanges = (config?: UserConfig) => {
  const creatinineRange = getCreatinineRange(config?.gender)
  
  return {
    protein24h: NORMAL_RANGES_COMMON.PROTEIN_24H,
    creatinine: {
      min: creatinineRange.MIN,
      max: creatinineRange.MAX,
    },
    specificGravity: {
      min: NORMAL_RANGES_COMMON.SPECIFIC_GRAVITY_MIN,
      max: NORMAL_RANGES_COMMON.SPECIFIC_GRAVITY_MAX,
    },
    ph: {
      min: NORMAL_RANGES_COMMON.PH_MIN,
      max: NORMAL_RANGES_COMMON.PH_MAX,
    },
  }
}
// AIGC END

