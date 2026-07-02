// 检测结果显示组件 — 统一异常值标红 + ⚠️ 前缀逻辑，消除 Record / Detail 间的重复
import { Space } from 'antd-mobile'
import type { TestResult, UserConfig } from '@/types'
import { formatDateTime } from '@/utils'
import { getNormalRanges, isAbnormal, warnIf } from '@/utils/normalRanges'

interface TestResultDisplayProps {
  testResults: TestResult
  userConfig?: UserConfig | null
}

const TestResultDisplay = ({ testResults, userConfig }: TestResultDisplayProps) => {
  const normalRanges = getNormalRanges(userConfig || undefined)

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div>
        24H尿蛋白定量: {testResults.protein24hQuantitative} mg/L
        {testResults.proteinTotal24h && (
          <span>
            {' '}
            (24h总蛋白:{' '}
            <span
              style={{
                color: isAbnormal(
                  (testResults.proteinTotal24h ?? 0) * 1000,
                  0,
                  normalRanges.protein24h,
                )
                  ? 'red'
                  : 'inherit',
              }}
            >
              {warnIf(
                isAbnormal((testResults.proteinTotal24h ?? 0) * 1000, 0, normalRanges.protein24h),
                `${testResults.proteinTotal24h.toFixed(2)} g`,
              )}
            </span>
            )
          </span>
        )}
      </div>
      {testResults.proteinRoutine && (
        <div>
          尿常规-尿蛋白: <span style={{ fontWeight: 'bold' }}>{testResults.proteinRoutine}</span>
        </div>
      )}
      {testResults.occultBlood && (
        <div>
          尿常规-潜血: <span style={{ fontWeight: 'bold' }}>{testResults.occultBlood}</span>
        </div>
      )}
      <div>
        肌酐:{' '}
        <span
          style={{
            color: isAbnormal(
              testResults.creatinine,
              normalRanges.creatinine.min,
              normalRanges.creatinine.max,
            )
              ? 'red'
              : 'inherit',
          }}
        >
          {warnIf(
            isAbnormal(
              testResults.creatinine,
              normalRanges.creatinine.min,
              normalRanges.creatinine.max,
            ),
            `${testResults.creatinine} μmol/L`,
          )}
        </span>
      </div>
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
      <div>
        尿比重:{' '}
        <span
          style={{
            color: isAbnormal(
              testResults.specificGravity,
              normalRanges.specificGravity.min,
              normalRanges.specificGravity.max,
            )
              ? 'red'
              : 'inherit',
          }}
        >
          {warnIf(
            isAbnormal(
              testResults.specificGravity,
              normalRanges.specificGravity.min,
              normalRanges.specificGravity.max,
            ),
            `${testResults.specificGravity}`,
          )}
        </span>
      </div>
      <div>
        pH值:{' '}
        <span
          style={{
            color: isAbnormal(testResults.ph, normalRanges.ph.min, normalRanges.ph.max)
              ? 'red'
              : 'inherit',
          }}
        >
          {warnIf(
            isAbnormal(testResults.ph, normalRanges.ph.min, normalRanges.ph.max),
            `${testResults.ph}`,
          )}
        </span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)', marginTop: '8px' }}>
        检测时间: {formatDateTime(testResults.testedAt)}
      </div>
    </Space>
  )
}

export default TestResultDisplay
