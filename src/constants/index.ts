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

// --- 尿常规值映射（字符串 ↔ 数值，供图表使用） ---

// 尿常规字符串 → 数值
export const ROUTINE_STRING_TO_VALUE: Record<string, number> = {
  '阴性(-)': 0,
  '阴性': 0,
  '-': 0,
  '弱阳性(±)': 0.5,
  '弱阳性': 0.5,
  '±': 0.5,
  '1+': 1,
  '++': 1,
  '2+': 2,
  '+++': 2,
  '3+': 3,
  '++++': 3,
  '4+': 4,
}

// 数值 → 显示标签
export const ROUTINE_VALUE_TO_LABEL: Record<number, string> = {
  0: '阴性(-)',
  0.5: '弱阳性(±)',
  1: '1+/++',
  2: '2+/+++',
  3: '3+/++++',
  4: '4+',
}

// Selector 选项（供尿常规-尿蛋白/潜血表单使用）
export const URINE_ROUTINE_OPTIONS = [
  { label: '阴性(-)', value: '阴性(-)' },
  { label: '弱阳性(±)', value: '弱阳性(±)' },
  { label: '1+', value: '1+' },
  { label: '2+', value: '2+' },
  { label: '3+', value: '3+' },
  { label: '4+', value: '4+' },
  { label: '++', value: '++' },
  { label: '+++', value: '+++' },
  { label: '++++', value: '++++' },
]

// 将尿常规字符串转为图表数值
export const convertRoutineValue = (value: string | undefined): number | null => {
  if (!value) return null
  const normalized = String(value).trim()
  const result = ROUTINE_STRING_TO_VALUE[normalized]
  return result !== undefined ? result : null
}

// 将图表数值转为显示标签
export const getRoutineLabel = (value: number | null): string => {
  return value !== null ? ROUTINE_VALUE_TO_LABEL[value] || '' : '无数据'
}

