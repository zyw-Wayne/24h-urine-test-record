// AIGC START
// 常量定义

// 正常值范围（不区分性别）
export const NORMAL_RANGES_COMMON = {
  PROTEIN_24H: 150, // 24小时尿蛋白正常值上限 (mg) - 男女通用
  SPECIFIC_GRAVITY_MIN: 1.003, // 尿比重正常值下限 - 男女通用
  SPECIFIC_GRAVITY_MAX: 1.030, // 尿比重正常值上限 - 男女通用
  PH_MIN: 4.6, // pH正常值下限 - 男女通用
  PH_MAX: 8.0, // pH正常值上限 - 男女通用
}

// 肌酐正常值范围（区分性别）
export const NORMAL_RANGES_CREATININE = {
  MALE: {
    MIN: 53, // 男性肌酐正常值下限 (μmol/L)
    MAX: 106, // 男性肌酐正常值上限 (μmol/L)
  },
  FEMALE: {
    MIN: 44, // 女性肌酐正常值下限 (μmol/L)
    MAX: 97, // 女性肌酐正常值上限 (μmol/L)
  },
}

// 兼容旧代码（使用女性范围作为默认值）
export const NORMAL_RANGES = {
  PROTEIN_24H: NORMAL_RANGES_COMMON.PROTEIN_24H,
  CREATININE_MIN: NORMAL_RANGES_CREATININE.FEMALE.MIN,
  CREATININE_MAX: NORMAL_RANGES_CREATININE.FEMALE.MAX,
  SPECIFIC_GRAVITY_MIN: NORMAL_RANGES_COMMON.SPECIFIC_GRAVITY_MIN,
  SPECIFIC_GRAVITY_MAX: NORMAL_RANGES_COMMON.SPECIFIC_GRAVITY_MAX,
  PH_MIN: NORMAL_RANGES_COMMON.PH_MIN,
  PH_MAX: NORMAL_RANGES_COMMON.PH_MAX,
}

// 检测周期时长（毫秒）
export const CYCLE_DURATION = 24 * 60 * 60 * 1000 // 24小时

// 数据库名称
export const DB_NAME = 'UrineTestDB'
export const DB_VERSION = 1

// 默认用户配置
export const DEFAULT_USER_CONFIG = {
  nickname: '用户',
  unit: {
    volume: 'ml' as const,
    protein: 'mg' as const,
  },
  theme: 'light' as const,
}

// 备份文件版本
export const BACKUP_VERSION = '1.0.0'
// AIGC END

