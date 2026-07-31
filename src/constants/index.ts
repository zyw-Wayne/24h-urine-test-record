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

// 尿酸正常值范围（区分性别）
export const NORMAL_RANGES_URIC_ACID = {
  MALE: {
    MIN: 210,   // 男性尿酸正常值下限 (μmol/L)
    MAX: 430,   // 男性尿酸正常值上限 (μmol/L)
  },
  FEMALE: {
    MIN: 150,   // 女性尿酸正常值下限 (μmol/L)
    MAX: 380,   // 女性尿酸正常值上限 (μmol/L)
  },
}

// 检测周期时长（毫秒）
export const CYCLE_DURATION = 24 * 60 * 60 * 1000 // 24小时

// 数据库名称
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
export const BACKUP_VERSION = '1.1.0'

// App 版本号（需与 android/app/build.gradle 的 versionName 保持同步）
export const APP_VERSION = '1.2.0'

// 尿常规 Selector 选项（供尿常规-尿蛋白/潜血表单使用）
// 只保留数字写法；历史数据中的 ++/+++/++++ 仍会被 convertRoutineValue 映射表正确识别
export const URINE_ROUTINE_OPTIONS = [
  { label: '阴性(-)', value: '阴性(-)' },
  { label: '弱阳性(±)', value: '弱阳性(±)' },
  { label: '1+', value: '1+' },
  { label: '2+', value: '2+' },
  { label: '3+', value: '3+' },
  { label: '4+', value: '4+' },
]

