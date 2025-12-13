// AIGC START
// 常量定义

// 正常值范围
export const NORMAL_RANGES = {
  PROTEIN_24H: 150, // 24小时尿蛋白正常值上限 (mg)
  CREATININE_MIN: 44, // 肌酐正常值下限 (μmol/L)
  CREATININE_MAX: 133, // 肌酐正常值上限 (μmol/L)
  SPECIFIC_GRAVITY_MIN: 1.003, // 尿比重正常值下限
  SPECIFIC_GRAVITY_MAX: 1.030, // 尿比重正常值上限
  PH_MIN: 4.6, // pH正常值下限
  PH_MAX: 8.0, // pH正常值上限
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

