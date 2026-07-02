# 尿酸指标录入 & 图表调整 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 24 小时尿蛋白检测 App 中新增尿酸（Uric Acid）指标录入与展示，并调整图表。

**Architecture:** 尿酸作为 `TestResult` 的一个新数字字段，按性别区分正常值范围（与肌酐模式一致）。表单在 Record 和 History 两处各自插入 Form.Item，不抽取公共组件。图表三个变动：Y 轴 stepSize 修正、移除多指标对比、新增尿酸折线图。备份兼容性通过版本号升级 + 导入后缺字段检测处理。

**Tech Stack:** React 18 + TypeScript + Ant Design Mobile + Chart.js + Dexie (IndexedDB) + XLSX

## Global Constraints

- `uricAcid` 为必填字段（与 `creatinine` 同级）
- 旧记录（`uricAcid === undefined`）编辑时使用 `uricAcidRulesOptional`（非必填），不阻塞保存
- 正常值范围：男 210-430 μmol/L，女 150-380 μmol/L；性别未设置时默认女性范围
- 图表 Y 轴 stepSize: 0.5 → 1
- 多指标对比卡片需完全移除
- 新增尿酸折线图置于肌酐趋势之后、潜血趋势之前
- BACKUP_VERSION: "1.0.0" → "1.1.0"
- 导入旧版备份时检测缺尿酸记录，Toast 提示"编辑时可选填"

---

### Task 1: 数据模型 + 常量 + 正常值范围函数（底层依赖）

**Files:**
- Modify: `src/types/index.ts:34` — TestResult 新增 `uricAcid` 字段
- Modify: `src/constants/index.ts:12-22` — 新增 `NORMAL_RANGES_URIC_ACID`
- Modify: `src/constants/index.ts:50` — BACKUP_VERSION "1.0.0" → "1.1.0"
- Modify: `src/utils/normalRanges.ts` — 新增 `getUricAcidRange` + `getNormalRanges` 返回新增尿酸

**Interfaces:**
- Consumes: 无（本任务是底层依赖，其他任务依赖本任务）
- Produces: `TestResult` 接口含 `uricAcid: number`；`NORMAL_RANGES_URIC_ACID` 常量；`getUricAcidRange(gender?)` 函数

- [ ] **Step 1: TestResult 新增 uricAcid 字段**

在 `src/types/index.ts` 第 34 行（`creatinine: number` 之后）插入：

```typescript
export interface TestResult {
  protein24hQuantitative: number  // 24H尿蛋白定量(mg/L)
  proteinTotal24h?: number        // 24h总蛋白(g)
  proteinRoutine?: string         // 尿常规-尿蛋白
  occultBlood?: string            // 尿常规-潜血
  creatinine: number              // 肌酐(μmol/L)
  uricAcid: number                // ★ 新增：尿酸(μmol/L)
  specificGravity: number         // 尿比重
  ph: number                      // pH值
  testedAt: string                // 检测时间
}
```

- [ ] **Step 2: 新增尿酸正常值范围常量**

在 `src/constants/index.ts` 中 `NORMAL_RANGES_CREATININE` 之后、`NORMAL_RANGES` 之前，插入：

```typescript
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
```

- [ ] **Step 3: 升级 BACKUP_VERSION**

`src/constants/index.ts` 第 50 行：

```typescript
export const BACKUP_VERSION = '1.1.0'  // 原为 '1.0.0'
```

- [ ] **Step 4: 新增 getUricAcidRange + 更新 getNormalRanges**

`src/utils/normalRanges.ts`：

在第 8-14 行的 `getCreatinineRange` 之后，新增：

```typescript
/**
 * 根据用户性别获取尿酸正常值范围
 */
export const getUricAcidRange = (gender?: 'male' | 'female') => {
  if (gender === 'male') {
    return NORMAL_RANGES_URIC_ACID.MALE
  }
  // 默认使用女性范围（更保守）
  return NORMAL_RANGES_URIC_ACID.FEMALE
}
```

在 `getNormalRanges` 函数的 imports 中新增 `NORMAL_RANGES_URIC_ACID`：

```typescript
import { NORMAL_RANGES_COMMON, NORMAL_RANGES_CREATININE, NORMAL_RANGES_URIC_ACID } from '@/constants'
```

在 `getNormalRanges` 函数体内部新增尿酸范围：

```typescript
export const getNormalRanges = (config?: UserConfig) => {
  const creatinineRange = getCreatinineRange(config?.gender)
  const uricAcidRange = getUricAcidRange(config?.gender)  // ★ 新增
  
  return {
    protein24h: NORMAL_RANGES_COMMON.PROTEIN_24H,
    creatinine: {
      min: creatinineRange.MIN,
      max: creatinineRange.MAX,
    },
    uricAcid: {            // ★ 新增
      min: uricAcidRange.MIN,
      max: uricAcidRange.MAX,
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
```

- [ ] **Step 5: 验证类型定义**

验证方式：确保 TypeScript 编译通过

```bash
npx tsc --noEmit
```
预期：无 `uricAcid` 相关类型错误。（可能会有其他文件报 `uricAcid` 未使用的错误，忽略，后续任务会使用）

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/constants/index.ts src/utils/normalRanges.ts
git commit -m "feat: add uric acid field to TestResult type, consts, and normal range functions"
```

---

### Task 2: 校验规则

**Files:**
- Modify: `src/utils/validators.ts` — 新增 `uricAcidRules` + `uricAcidRulesOptional`

**Interfaces:**
- Consumes: Task 1 (TestResult 已含 uricAcid)
- Produces: `uricAcidRules` (必填), `uricAcidRulesOptional` (选填)

- [ ] **Step 1: 新增尿酸校验规则**

在 `src/utils/validators.ts` 第 65 行（`creatinineRules` 之后）插入：

```typescript
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
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```
预期：无错误

- [ ] **Step 3: Commit**

```bash
git add src/utils/validators.ts
git commit -m "feat: add uric acid validation rules (required + optional for old records)"
```

---

### Task 3: Record 页面表单

**Files:**
- Modify: `src/pages/Record/index.tsx:226-233` — `handleSaveTestResult` 函数签名新增 `uricAcid`
- Modify: `src/pages/Record/index.tsx:580-586` — 肌酐之后插入尿酸 Form.Item

**Interfaces:**
- Consumes: Task 2 (`uricAcidRules`)
- Produces: Record 页面可录入尿酸

- [ ] **Step 1: 更新 handleSaveTestResult 函数签名**

将第 226-233 行改为：

```typescript
const handleSaveTestResult = async (values: {
  protein24hQuantitative: number
  proteinRoutine?: string
  occultBlood?: string
  creatinine: number
  uricAcid: number        // ★ 新增
  specificGravity: number
  ph: number
}) => {
```

- [ ] **Step 2: 表单插入尿酸输入框**

在第 586 行（肌酐 Form.Item 结束）之后、第 587 行（specificGravity Form.Item 开始）之前，插入：

```tsx
<Form.Item
  name="uricAcid"
  label="尿酸(μmol/L)"
  rules={uricAcidRules}
>
  <Input type="number" placeholder="请输入尿酸" inputMode="decimal" />
</Form.Item>
```

记得在文件顶部 imports 中添加 `uricAcidRules`：

```typescript
import { protein24hRules, creatinineRules, specificGravityRules, phRules, uricAcidRules } from '@/utils/validators'
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```
预期：无错误

勾选"手动录入"进行功能验证：开始一个检测周期 → 结束 → 录入检测结果 → 确认尿酸字段出现、可填入、必填校验生效。

- [ ] **Step 4: Commit**

```bash
git add src/pages/Record/index.tsx
git commit -m "feat: add uric acid input field to Record page test result form"
```

---

### Task 4: History 页面表单

**Files:**
- Modify: `src/pages/History/index.tsx:121-131` — `handleSaveManualRecord` 函数签名新增 `uricAcid`
- Modify: `src/pages/History/index.tsx:148-157` — `testResult` 构造对象新增 `uricAcid`
- Modify: `src/pages/History/index.tsx:498-504` — 肌酐之后插入尿酸 Form.Item（含条件规则）

**Interfaces:**
- Consumes: Task 2 (`uricAcidRules`, `uricAcidRulesOptional`)
- Produces: History 页面可录入/编辑尿酸

- [ ] **Step 1: 更新 handleSaveManualRecord 函数签名**

将第 121-131 行改为：

```typescript
const handleSaveManualRecord = async (values: {
  startTime: Date
  totalVolume: number
  protein24hQuantitative: number
  proteinTotal24h?: number
  proteinRoutine?: string
  occultBlood?: string
  creatinine: number
  uricAcid?: number       // ★ 新增（可选，兼容旧记录编辑）
  specificGravity: number
  ph: number
}) => {
```

- [ ] **Step 2: 更新 testResult 构造对象**

在第 148-157 行，在 `creatinine` 行之后插入：

```typescript
const testResult: TestResult = {
  protein24hQuantitative: values.protein24hQuantitative,
  proteinTotal24h,
  proteinRoutine: values.proteinRoutine,
  occultBlood: values.occultBlood,
  creatinine: values.creatinine,
  uricAcid: values.uricAcid as number,  // ★ 新增
  specificGravity: values.specificGravity,
  ph: values.ph,
  testedAt: startTime,
}
```

> 使用 `as number` 类型断言是因为 `values.uricAcid` 声明为 `uricAcid?: number`（兼容旧记录编辑时未填），但 TestResult 接口要求 `uricAcid: number`。实际运行时，新记录必填保证有值；旧记录编辑时表单使用非必填规则，若用户不填则传 `undefined`，此时 `as number` 会转为 `undefined` 写入 IndexedDB。

- [ ] **Step 3: 表单插入尿酸输入框（含条件规则）**

在第 498-504 行附近（肌酐 Form.Item 之后、specificGravity 之前），插入：

```tsx
<Form.Item
  name="uricAcid"
  label="尿酸(μmol/L)"
  rules={editingCycle?.testResults?.uricAcid === undefined ? uricAcidRulesOptional : uricAcidRules}
>
  <Input type="number" placeholder="请输入尿酸" inputMode="decimal" />
</Form.Item>
```

在文件顶部 imports 中添加：

```typescript
import { protein24hRules, creatinineRules, specificGravityRules, phRules, proteinTotal24hRules, uricAcidRules, uricAcidRulesOptional } from '@/utils/validators'
```

- [ ] **Step 4: 编辑旧记录时回填 uricAcid**

在 `handleEditCycle` 函数（第 89-111 行）中，`manualForm.setFieldsValue` 调用处新增 `uricAcid`：

```typescript
manualForm.setFieldsValue({
  startTime: startTimeValue,
  totalVolume: cycle.totalVolume,
  protein24hQuantitative: cycle.testResults?.protein24hQuantitative,
  proteinTotal24h: cycle.testResults?.proteinTotal24h,
  proteinRoutine: cycle.testResults?.proteinRoutine,
  occultBlood: cycle.testResults?.occultBlood,
  creatinine: cycle.testResults?.creatinine,
  uricAcid: cycle.testResults?.uricAcid,        // ★ 新增
  specificGravity: cycle.testResults?.specificGravity,
  ph: cycle.testResults?.ph,
})
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
```
预期：无错误

- [ ] **Step 6: Commit**

```bash
git add src/pages/History/index.tsx
git commit -m "feat: add uric acid input field to History page form with conditional validation"
```

---

### Task 5: 显示组件

**Files:**
- Modify: `src/components/Common/TestResultDisplay.tsx` — 新增尿酸显示行（条件渲染）

**Interfaces:**
- Consumes: Task 1 (getNormalRanges 已返回 uricAcid 范围)
- Produces: TestResult 详情可展示尿酸值

- [ ] **Step 1: 新增尿酸显示行**

在第 75 行（肌酐显示行结束）之后、第 76 行（尿比重行开始）之前插入：

```tsx
{testResults.uricAcid !== undefined && (
  <div>
    尿酸:{' '}
    <span style={{
      color: isAbnormal(
        testResults.uricAcid,
        normalRanges.uricAcid.min,
        normalRanges.uricAcid.max,
      ) ? 'red' : 'inherit',
    }}>
      {warnIf(
        isAbnormal(
          testResults.uricAcid,
          normalRanges.uricAcid.min,
          normalRanges.uricAcid.max,
        ),
        `${testResults.uricAcid} μmol/L`,
      )}
    </span>
  </div>
)}
```

> 使用 `{testResults.uricAcid !== undefined && (...)}` 条件渲染，确保旧记录（无尿酸字段）不显示"undefined"。

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```
预期：无错误

- [ ] **Step 3: Commit**

```bash
git add src/components/Common/TestResultDisplay.tsx
git commit -m "feat: display uric acid in TestResultDisplay with conditional rendering"
```

---

### Task 6: Excel 导出

**Files:**
- Modify: `src/services/export.ts:24-27` — 新增尿酸列 + 更新列宽

- [ ] **Step 1: 新增尿酸导出列**

在第 24 行（肌酐列之后）插入：

```typescript
尿酸: cycle.testResults?.uricAcid ? `${cycle.testResults.uricAcid} μmol/L` : '',
```

- [ ] **Step 2: 更新列宽数组**

列宽数组新增一列：

```typescript
cycleWs['!cols'] = [
  { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
  { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
  { wch: 15 }, { wch: 15 }, { wch: 15 },  // ← { wch: 15 } 是尿酸列
  { wch: 10 }, { wch: 10 },
  { wch: 12 },
]
```

> 注意：总列数从 13 变为 14。当前列宽数组（第 49-54 行）有 13 个元素，新增后为 14 个。

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```
预期：无错误

- [ ] **Step 4: Commit**

```bash
git add src/services/export.ts
git commit -m "feat: add uric acid column to Excel export"
```

---

### Task 7: 图表变更

**Files:**
- Modify: `src/pages/History/Chart.tsx` — 3 项变更

- [ ] **Step 1: Y 轴 stepSize 修正 (0.5 → 1)**

第 97 行：`stepSize: 0.5` → `stepSize: 1`

```typescript
ticks: {
  stepSize: 1,  // 原为 0.5
  callback(value: number | string, _index: number, _ticks: Tick[]) {
```

- [ ] **Step 2: 移除多指标对比**

三处删除：

**a)** 第 46 行：从解构中移除 `comparisonChartData`

```typescript
const {
  hasProtein24h,
  hasCreatinine,
  protein24hQuantitativeChartData,
  proteinRoutineChartData,
  occultBloodChartData,
  creatinineChartData,
  // comparisonChartData,  ← 删除
  chartOptions,
  routineChartOptions,
} = useMemo(() => {
```

**b)** 第 55-58 行：移除 `volumes` 和 `proteins` 数组（仅对比图使用）

```typescript
const labels = sortedCycles.map((cycle) => formatDate(cycle.startTime))
// ↓ 删除以下两行
// const volumes = sortedCycles.map((cycle) => cycle.totalVolume)
// const proteins = sortedCycles
//   .map((cycle) => (cycle.testResults?.proteinTotal24h || 0) * 1000)
//   .map((v) => (v === 0 ? null : v))
const protein24hQuantitative = sortedCycles
```

**c)** 第 148-156 行：移除 `comparisonChartData` 返回值

```typescript
// ↓ 删除以下整个代码块
// comparisonChartData: {
//   labels,
//   datasets: [
//     { label: '总尿量 (ml)', data: volumes, backgroundColor: 'rgba(75, 192, 192, 0.5)' },
//     { label: '24h总蛋白 (mg)', data: proteins, backgroundColor: 'rgba(255, 99, 132, 0.5)' },
//     { label: '24H尿蛋白定量 (mg/L)', data: protein24hQuantitative, backgroundColor: 'rgba(255, 159, 64, 0.5)' },
//     { label: '肌酐 (μmol/L)', data: creatinines, backgroundColor: 'rgba(54, 162, 235, 0.5)' },
//   ],
// },
```

**d)** 第 213-217 行：移除 JSX 中的多指标对比 Card

```tsx
{/* ↓ 删除以下整个代码块 */}
{/* <Card title="多指标对比">
  <div style={{ height: '300px' }}>
    <Bar data={comparisonChartData} options={chartOptions} />
  </div>
</Card> */}
```

- [ ] **Step 3: 新增尿酸折线趋势图**

在 `useMemo` 内部（第 65 行 `occultBloodValues` 之后）新增数据定义：

```typescript
const uricAcids = sortedCycles
  .map((cycle) => cycle.testResults?.uricAcid || null)
  .map((v) => (v === 0 ? null : v))

const hasUricAcid = uricAcids.some((v: number | null) => v !== null)
```

在 return 对象中（`creatinineChartData` 之后、`chartOptions` 之前）新增：

```typescript
uricAcidChartData: {
  labels,
  datasets: [{
    label: '尿酸 (μmol/L)',
    data: uricAcids,
    borderColor: 'rgb(46, 204, 113)',
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    tension: 0.1,
  }],
},
```

在解构中新增 `uricAcidChartData` 和 `hasUricAcid`：

```typescript
const {
  hasProtein24h,
  hasCreatinine,
  hasUricAcid,                          // ★ 新增
  protein24hQuantitativeChartData,
  proteinRoutineChartData,
  occultBloodChartData,
  creatinineChartData,
  uricAcidChartData,                    // ★ 新增
  chartOptions,
  routineChartOptions,
} = useMemo(() => {
```

在 JSX 中（肌酐趋势 Card 之后、潜血趋势 Card 之前）新增：

```tsx
{hasUricAcid && (
  <Card title="尿酸趋势">
    <div style={{ height: '250px' }}>
      <Line data={uricAcidChartData} options={chartOptions} />
    </div>
  </Card>
)}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```
预期：无错误

- [ ] **Step 5: Commit**

```bash
git add src/pages/History/Chart.tsx
git commit -m "feat: chart adjustments - fix Y axis stepSize, remove comparison chart, add uric acid line chart"
```

---

### Task 8: 备份/导入兼容性

**Files:**
- Modify: `src/services/backup.ts:31-87` — `importBackup` 返回类型变更 + 缺字段检测
- Modify: `src/pages/Profile/index.tsx:97-106` — 消费 importBackup 返回的 warnings

**Interfaces:**
- Consumes: Task 1 (BACKUP_VERSION 已是 "1.1.0")
- Produces: 导入旧版备份时 Toast 提示缺尿酸记录

- [ ] **Step 1: 修改 importBackup 返回类型 + 缺字段检测**

`src/services/backup.ts` 第 31 行修改函数签名：

```typescript
export const importBackup = async (file: File): Promise<{ warnings: string[] } | void> => {
```

在数据恢复完成之后（第 70 行 `}` 之前）、`resolve()` 之前插入：

```typescript
        // 检测旧版备份中缺尿酸的记录
        const missingUricAcidCount = backupData.testCycles.filter(
          (c) => c.testResults && c.testResults.uricAcid === undefined
        ).length

        const warnings: string[] = []
        if (missingUricAcidCount > 0) {
          warnings.push(`有 ${missingUricAcidCount} 条旧记录缺少尿酸数据，编辑时可选填`)
        }

        return warnings.length > 0 ? { warnings } : undefined
```

- [ ] **Step 2: 修改 Profile 导入后处理**

`src/pages/Profile/index.tsx` 第 97-106 行：

```typescript
      try {
        const result = await importBackup(file)
        Toast.show({ content: '恢复成功', icon: 'success' })
        if (result?.warnings?.length) {
          // 短暂延迟避免 Toast 叠加
          setTimeout(() => {
            Toast.show({ content: result.warnings[0], icon: 'info', duration: 3000 })
          }, 500)
        }
        await loadConfig()
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```
预期：无错误

- [ ] **Step 4: Commit**

```bash
git add src/services/backup.ts src/pages/Profile/index.tsx
git commit -m "fix: handle backward compatibility for old backup imports missing uric acid"
```

---

### Task 9: 最终验证

**Files:** 全部已修改文件

- [ ] **Step 1: 全量验证**

```bash
# 类型检查
npx tsc --noEmit

# 构建
npm run build
```
预期：退出码 0，无报错

- [ ] **Step 2: 功能验证清单**

| # | 验证项 | 预期 |
|---|--------|------|
| 1 | Record 页面录入检测结果 | 尿酸字段出现、必填、保存后显示 |
| 2 | History 页面手动录入 | 尿酸字段出现、必填、保存后显示 |
| 3 | History 页面编辑旧记录（无尿酸） | 尿酸字段出现、允许为空、保存不阻塞 |
| 4 | History 页面编辑已有尿酸记录 | 尿酸字段出现、有回填值、必填 |
| 5 | 详情页显示尿酸 | 有值则显示，无值不显示行 |
| 6 | 尿酸异常值标红 | 超出性别范围时标红+⚠️ |
| 7 | Excel 导出 | 尿酸列存在、值正确 |
| 8 | 尿蛋白趋势 Y 轴 | 无 0.5/1.5 等小数刻度 |
| 9 | 潜血趋势 Y 轴 | 无 0.5/1.5 等小数刻度 |
| 10 | 多指标对比已移除 | 图表区域无该卡片 |
| 11 | 尿酸趋势折线图 | 有数据时显示、无数据时不显示 |
| 12 | 旧版备份导入 | 导入成功后 Toast 提示缺尿酸 |
| 13 | 新版备份导出 → 导入 | 尿酸数据完整保留 |

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: complete uric acid feature with chart adjustments and backward compatibility"
```
