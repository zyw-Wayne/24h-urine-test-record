# 尿酸指标录入 & 图表调整方案

**日期**: 2026-07-02  
**状态**: 待批准  
**涉及版本**: 24h-urine-test-mobile

---

## 1. 概述

在现有 24 小时尿蛋白检测系统中新增 **尿酸（Uric Acid）** 指标，同时调整图表展示。

### 1.1 变更清单

| # | 变更 | 类型 | 涉及文件 |
|---|------|------|----------|
| 1 | TestResult 新增 `uricAcid` 字段 | 数据模型 | `src/types/index.ts` |
| 2 | 尿酸正常值范围（按性别） | 常量 | `src/constants/index.ts` |
| 3 | 尿酸正常值范围查询函数 | 工具 | `src/utils/normalRanges.ts` |
| 4 | 尿酸校验规则（必填数字） | 校验 | `src/utils/validators.ts` |
| 5 | Record 页面录入表单新增尿酸字段 | 表单 | `src/pages/Record/index.tsx` |
| 6 | History 页面录入/编辑表单新增尿酸字段 | 表单 | `src/pages/History/index.tsx` |
| 7 | 结果显示组件展示尿酸（含异常判断） | 展示 | `src/components/Common/TestResultDisplay.tsx` |
| 8 | Excel 导出新增尿酸列 | 导出 | `src/services/export.ts` |
| 9 | 尿蛋白/潜血趋势图 Y 轴 stepSize 1.5→1 | 图表修正 | `src/pages/History/Chart.tsx` |
| 10 | 移除多指标对比卡片 | 图表调整 | `src/pages/History/Chart.tsx` |
| 11 | 新增尿酸折线趋势图 | 图表新增 | `src/pages/History/Chart.tsx` |

---

## 2. 详细设计

### 2.1 数据模型变更

#### `src/types/index.ts` — TestResult 新增字段

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

> `uricAcid` 为必填字段（与 `creatinine` 同级），录入时校验规则为必填数字。

### 2.2 常量定义

#### `src/constants/index.ts`

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

// 兼容旧代码（使用女性范围作为默认值）— 与肌酐模式一致
// 在 NORMAL_RANGES 对象中也添加（可选，保持向后兼容）
```

### 2.3 正常值范围函数

#### `src/utils/normalRanges.ts`

新增 `getUricAcidRange(gender?)` 函数（与 `getCreatinineRange` 模式一致），在 `getNormalRanges` 返回值中新增 `uricAcid` 字段。

### 2.4 校验规则

#### `src/utils/validators.ts`

```typescript
/** 尿酸校验规则 */
export const uricAcidRules = [
  { required: true, message: '请输入尿酸' },
  requiredNumber,
  nonNegativeValidator,
]
```

与 `creatinineRules` 完全一致：必填、数字格式、不能为负数。

```typescript
/** 尿酸校验规则（旧记录编辑时使用，无 required） */
export const uricAcidRulesOptional = [
  { required: false },
  requiredNumber,
  nonNegativeValidator,
]
```

### 2.5 表单变更

#### Record 页面 (`src/pages/Record/index.tsx`)

在两个位置修改：

1. **`handleSaveTestResult` 函数签名**（约第 226 行）— 新增 `uricAcid` 字段
2. **表单弹窗**（约第 580 行附近）— 在肌酐字段之后、尿比重之前，插入：

```tsx
<Form.Item
  name="uricAcid"
  label="尿酸(μmol/L)"
  rules={uricAcidRules}
>
  <Input type="number" placeholder="请输入尿酸" inputMode="decimal" />
</Form.Item>
```

#### History 页面 (`src/pages/History/index.tsx`)

在两个位置修改：

1. **`handleSaveManualRecord` 函数签名**（约第 121 行）— 新增 `uricAcid` 字段
2. **表单弹窗**（约第 505 行附近）— 在肌酐字段之后、尿比重之前，插入与 Record 页面相同的 Form.Item

> **条件校验规则**：History 表单打开编辑旧记录时，若 `editingCycle?.testResults?.uricAcid === undefined`（即旧记录缺少尿酸字段），则使用 `uricAcidRulesOptional`（非必填）；新记录或已有尿酸值的记录使用 `uricAcidRules`（必填）。Record 页面始终使用 `uricAcidRules`（因为 Record 仅用于进行中周期，不存在旧记录编辑场景）。

### 2.6 显示组件

#### `src/components/Common/TestResultDisplay.tsx`

在肌酐行之后，新增尿酸显示行（与肌酐完全相同的异常判断模式）：

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

> `History/Detail.tsx` 已复用 `TestResultDisplay` 组件，无需额外修改。

### 2.7 Excel 导出

#### `src/services/export.ts`

在检测周期 Sheet 的字段列表（约第 24 行）中，在肌酐列之后新增：

```typescript
尿酸: cycle.testResults?.uricAcid ? `${cycle.testResults.uricAcid} μmol/L` : '',
```

同时更新列宽数组，新增一列宽度 `{ wch: 15 }`。

### 2.8 图表调整

#### `src/pages/History/Chart.tsx`

共 3 项变更：

##### ① Y 轴 stepSize 修正（1.5 → 1）

当前 `routineChartOptions` 中 `stepSize: 0.5` 导致纵轴出现 0.5、1.5 等不合理刻度（尿常规指标为离散分类值，不应有小数）。修改为：

```typescript
stepSize: 1,
```

##### ② 移除多指标对比卡片

两处删除：
- `useMemo` 返回值中移除 `comparisonChartData` 及相关计算（volumes、proteins 数组）
- JSX 渲染中移除第 213-217 行的 `<Card title="多指标对比">...</Card>` 区块

##### ③ 新增尿酸折线趋势图

在 `useMemo` 中新增：

```typescript
const uricAcids = sortedCycles
  .map((cycle) => cycle.testResults?.uricAcid || null)
  .map((v) => (v === 0 ? null : v))

const hasUricAcid = uricAcids.some((v: number | null) => v !== null)

// 在 datasets 中新增
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

在 JSX 渲染中（肌酐趋势之后、潜血趋势之前）新增：

```tsx
{hasUricAcid && (
  <Card title="尿酸趋势">
    <div style={{ height: '250px' }}>
      <Line data={uricAcidChartData} options={chartOptions} />
    </div>
  </Card>
)}
```

---

## 3. 影响范围汇总

| 层面 | 影响 |
|------|------|
| **数据存储** | IndexedDB 中已有的 TestCycle 记录的 `testResults` 不含 `uricAcid`，读取时该字段为 `undefined`。图表中使用 `?.uricAcid` 安全访问，不会报错。旧记录编辑时检测到 `uricAcid === undefined` 则使用非必填规则（`uricAcidRulesOptional`），不会阻塞保存。显示组件通过 `{testResults.uricAcid !== undefined && (...)}` 条件渲染，避免展示 "undefined"。 |
| **向后兼容** | 新增字段不对已有数据产生破坏性影响。在图表中 `undefined` 视为 null 不渲染。 |
| **表单联动** | History 页面的 totalVolume/protein24hQuantitative → proteinTotal24h 联动计算不受影响。 |

---

## 4. 数据兼容性处理

### 4.1 场景：旧版备份（无尿酸）→ 新版导入

**问题**：旧版 `BACKUP_VERSION === "1.0.0"`，JSON 中的 `TestCycle.testResults` 不含 `uricAcid`。导入后该字段值为 `undefined`，查看和图表无影响，但编辑时会因必填校验无法保存。

**处理方案**：

#### 修改 `src/services/backup.ts`

**a) 升级备份版本号**：在 `importBackup` 函数中**不直接引用常量**，以便判断版本来源。版本号自身也从 `"1.0.0"` → `"1.1.0"`。

**b) 导入后检测缺字段记录**：在数据恢复完成后（`backup.ts` 第 70 行 `resolve()` 之前），检查所有导入的周期是否缺少 `uricAcid`：

```typescript
// 检测旧版备份中缺尿酸的记录
const missingUricAcidCount = backupData.testCycles.filter(
  (c) => c.testResults && c.testResults.uricAcid === undefined
).length
```

**c) 返回警告信息**：将函数签名从 `Promise<void>` 改为 `Promise<{ warnings: string[] } | void>`，携带警告：

```typescript
const warnings: string[] = []
if (missingUricAcidCount > 0) {
  warnings.push(`有 ${missingUricAcidCount} 条旧记录缺少尿酸数据，编辑时可选填`)
}
// ...
return warnings.length > 0 ? { warnings } : undefined
```

#### 修改 `src/pages/Profile/index.tsx`

在导入成功后（约第 99-101 行）消费返回的警告信息：

```typescript
const result = await importBackup(file)
Toast.show({ content: '恢复成功', icon: 'success' })
if (result?.warnings?.length) {
  // 短暂延迟避免 Toast 叠加
  setTimeout(() => {
    Toast.show({ content: result.warnings[0], icon: 'info', duration: 3000 })
  }, 500)
}
```

### 4.2 场景：新版备份（含尿酸）→ 旧版导入

**问题**：新版备份 `version === "1.1.0"`，JSON 中包含 `uricAcid` 字段。旧版 `importBackup` 会：
- ✅ 成功解析 JSON（Dexie 对额外字段宽容）
- ✅ 成功写入 IndexedDB（字段被存储但旧版 UI 不渲染）
- ❌ 用户看不到尿酸数据（数据「有进无出」）
- ✅ 重新导出回新版后数据完整恢复

**处理方案**：

**a) 升级 `BACKUP_VERSION`**：`src/constants/index.ts` 中

```typescript
export const BACKUP_VERSION = '1.1.0'  // 原为 '1.0.0'
```

**b) 在 `exportBackup` 中携带版本**：当前已在 `BackupData.version` 写入 `BACKUP_VERSION`，新版导出会自动标记为 `1.1.0`。旧版导入时如果遇到 `1.1.0` 版本的备份，可以识别为高版本数据。但由于旧版代码未做版本兼容判断，此场景只能靠用户手动注意。

> **建议**：在「关于」页的使用说明中增加尿酸正常值参考，并提示备份版本变更。

### 4.3 用户配置表单新增性别提示

当前 `Profile/index.tsx` 第 289 行的性别帮助说明只提到肌酐，需要补充尿酸：

```tsx
help="用于判断肌酐及尿酸正常值范围（男/女）"
```

同时在使用说明中（约第 241-247 行）增加尿酸参考值条目。

---

## 5. 实施顺序建议

1. 数据类型 + 常量 + 工具函数（底层依赖）
2. 校验规则（含 `uricAcidRules` + `uricAcidRulesOptional`）
3. Record 页面表单
4. History 页面表单（含条件校验切换逻辑）
5. TestResultDisplay 组件（含条件渲染保护）
6. Excel 导出
7. 图表变更（Y 轴修正 + 移除对比图 + 新增尿酸折线图）
8. 备份/导入兼容性（`BACKUP_VERSION` 升级、`importBackup` 缺字段检测与警告）
9. 验证：分别测试 Record 录入保存、History 手动/编辑、旧记录编辑不阻塞、备份导入提醒、图表展示

---

## 6. 待确认事项

- [x] 尿酸正常值范围：采用标准参考值（男 210-430 μmol/L，女 150-380 μmol/L）
- [x] 录入方式：数字输入
- [x] 是否需要异常判断：是，与肌酐相同
