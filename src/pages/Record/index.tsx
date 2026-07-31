import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Button,
  Form,
  Input,
  DatePicker,
  Toast,
  ProgressBar,
  Space,
  Popup,
  List,
  Dialog,
  Selector,
} from 'antd-mobile'
import dayjs from 'dayjs'
import type { TestCycle, TestResult } from '@/types'
import { cycleService, urinationService } from '@/services/db'
import { formatDateTime, calculateProteinTotal24h, formatVolume } from '@/utils'
import { getNormalRanges, isAbnormal, warnIf } from '@/utils/normalRanges'
import { CYCLE_DURATION, URINE_ROUTINE_OPTIONS } from '@/constants'
import { volumeRules, protein24hRules, creatinineRules, specificGravityRules, phRules, uricAcidRules } from '@/utils/validators'
import { configService } from '@/services/db'
import type { UserConfig } from '@/types'
import Loading from '@/components/Common/Loading'
import EmptyState from '@/components/Common/EmptyState'
import TimerDisplay from '@/components/Common/TimerDisplay'
import TestResultDisplay from '@/components/Common/TestResultDisplay'


// 周期进度条子组件 — 独立管理每秒刷新，避免全页每秒重渲染
const calcCycleProgress = (startTime: string): number => {
  const start = dayjs(startTime)
  const elapsed = dayjs().diff(start)
  return Math.min((elapsed / CYCLE_DURATION) * 100, 100)
}

const CycleProgress = ({ startTime }: { startTime: string }) => {
  const [percent, setPercent] = useState(() => calcCycleProgress(startTime))

  useEffect(() => {
    setPercent(calcCycleProgress(startTime))
    const timer = setInterval(() => setPercent(calcCycleProgress(startTime)), 1000)
    return () => clearInterval(timer)
  }, [startTime])

  return <ProgressBar percent={percent} style={{ marginTop: '16px' }} />
}

const RecordPage = () => {
  const [currentCycle, setCurrentCycle] = useState<TestCycle | null>(null)
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [urinationFormVisible, setUrinationFormVisible] = useState(false)
  const [testResultFormVisible, setTestResultFormVisible] = useState(false)
  const [urinationForm] = Form.useForm()
  const [testResultForm] = Form.useForm()

  // 加载用户配置和当前检测周期
  useEffect(() => {
    const loadData = async () => {
      try {
        const config = await configService.get()
        setUserConfig(config)
      } catch (error) {
        console.error('加载用户配置失败', error)
      }
      await loadCurrentCycle()
      setInitialLoading(false)
    }
    loadData()
  }, [])

  const loadCurrentCycle = async () => {
    try {
      // 优先获取进行中的周期，如果没有则获取最新的周期（包括已完成的）
      let cycle = await cycleService.getOngoing()
      if (!cycle) {
        // 如果没有进行中的周期，获取最新的周期（可能是已完成的）
        cycle = await cycleService.getLatest()
      }
      setCurrentCycle(cycle)
    } catch (error) {
      Toast.show({ content: '加载数据失败', icon: 'fail' })
    }
  }

  // 开始新的检测周期
  const handleStartCycle = async () => {
    // 检查是否有上一个周期
    if (currentCycle) {
      // 如果当前周期还在进行中，不允许开始新周期
      if (currentCycle.status === 'ongoing') {
        Toast.show({ 
          content: '当前检测周期还在进行中，请先结束当前周期后再开始新周期', 
          icon: 'fail' 
        })
        return
      }

      const hasTestResults = !!currentCycle.testResults
      
      if (hasTestResults) {
        // 已录入检测结果，提示确认是否合适
        const confirmed = await Dialog.confirm({
          title: '确认开始新周期',
          content: `上一个检测周期（${formatDateTime(currentCycle.startTime)}）已录入检测结果。\n\n请确认检测结果已核对无误，确定要开始新的检测周期吗？`,
          confirmText: '确认无误，开始新周期',
          cancelText: '取消',
        })
        if (confirmed) {
          await createNewCycle()
        }
      } else {
        // 未录入检测结果，提示是否要录入
        const result = await Dialog.confirm({
          title: '检测结果未录入',
          content: `上一个检测周期（${formatDateTime(currentCycle.startTime)}）尚未录入检测结果。\n\n建议先录入检测结果以便完整记录，您也可以选择跳过直接开始新周期。`,
          confirmText: '先录入检测结果',
          cancelText: '跳过，直接开始新周期',
        })
        
        if (result) {
          // 用户选择"先录入检测结果"，打开录入弹窗
          if (currentCycle.testResults) {
            testResultForm.setFieldsValue(currentCycle.testResults)
          }
          setTestResultFormVisible(true)
        } else {
          // 用户选择"跳过"，再次确认
          const confirmSkip = await Dialog.confirm({
            title: '确认跳过录入',
            content: '确定要跳过录入检测结果，直接开始新的检测周期吗？\n\n跳过后将无法再为上一个周期录入检测结果。',
            confirmText: '确定跳过',
            cancelText: '取消',
          })
          if (confirmSkip) {
            await createNewCycle()
          }
        }
      }
    } else {
      // 没有上一个周期，直接开始新周期
      await createNewCycle()
    }
  }

  // 创建新周期的实际逻辑
  const createNewCycle = async () => {
    setLoading(true)
    try {
      const now = new Date().toISOString()
      const newCycle = await cycleService.create({
        startTime: now,
        status: 'ongoing',
        totalVolume: 0,
        urinationRecords: [],
      })
      setCurrentCycle(newCycle)
      Toast.show({ content: '检测周期已开始', icon: 'success' })
    } catch (error) {
      Toast.show({ content: '开始检测周期失败', icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  // 结束检测周期
  const handleEndCycle = async () => {
    if (!currentCycle) return

    // 显示确认弹窗
    Dialog.confirm({
      title: '确认结束检测周期',
      content: '结束检测周期后，将无法再添加排尿记录，但仍可录入检测结果。确定要结束吗？',
      confirmText: '确定结束',
      cancelText: '取消',
      onConfirm: async () => {
        setLoading(true)
        try {
          await cycleService.update(currentCycle.id, {
            status: 'completed',
            endTime: new Date().toISOString(),
          })
          Toast.show({ content: '检测周期已结束，您仍可录入检测结果', icon: 'success' })
          await loadCurrentCycle() // 重新加载周期数据
        } catch (error) {
          Toast.show({ content: '结束检测周期失败', icon: 'fail' })
        } finally {
          setLoading(false)
        }
      },
    })
  }

  // 添加排尿记录
  const handleAddUrination = async (values: { time: Date | string; volume: number }) => {
    if (!currentCycle) return
    if (currentCycle.status === 'completed') {
      Toast.show({ content: '检测周期已结束，无法添加排尿记录', icon: 'fail' })
      return
    }

    setLoading(true)
    try {
      const timeStr = values.time instanceof Date ? values.time.toISOString() : values.time
      await urinationService.add({
        cycleId: currentCycle.id,
        time: timeStr,
        volume: Number(values.volume),
      })
      await loadCurrentCycle()
      setUrinationFormVisible(false)
      urinationForm.resetFields()
      Toast.show({ content: '排尿记录已添加', icon: 'success' })
    } catch (error) {
      Toast.show({ content: '添加排尿记录失败', icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  // 删除排尿记录
  const handleDeleteUrination = async (id: string) => {
    if (!currentCycle) return
    if (currentCycle.status === 'completed') {
      Toast.show({ content: '检测周期已结束，无法删除排尿记录', icon: 'fail' })
      return
    }

    setLoading(true)
    try {
      await urinationService.delete(id)
      await loadCurrentCycle()
      Toast.show({ content: '记录已删除', icon: 'success' })
    } catch (error) {
      Toast.show({ content: '删除记录失败', icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  // 保存检测结果
  const handleSaveTestResult = async (values: {
    protein24hQuantitative: number
    proteinRoutine?: string
    occultBlood?: string
    creatinine: number
    uricAcid?: number
    specificGravity: number
    ph: number
  }) => {
    if (!currentCycle) return

    setLoading(true)
    try {
      const proteinTotal24h = calculateProteinTotal24h(
        values.protein24hQuantitative,
        currentCycle.totalVolume,
        userConfig?.unit.volume || 'ml'
      )
      const testResult: TestResult = {
        ...values,
        proteinTotal24h,
        testedAt: new Date().toISOString(),
      }

      await cycleService.update(currentCycle.id, {
        testResults: testResult,
      })
      await loadCurrentCycle()
      setTestResultFormVisible(false)
      testResultForm.resetFields()
      Toast.show({ content: '检测结果已保存', icon: 'success' })
    } catch (error) {
      Toast.show({ content: '保存检测结果失败', icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  // 计算平均尿量
  const averageVolume = useMemo(() => {
    if (!currentCycle || currentCycle.urinationRecords.length === 0) return 0
    return Math.round(currentCycle.totalVolume / currentCycle.urinationRecords.length)
  }, [currentCycle])

  // 获取正常值范围（根据用户性别）
  const normalRanges = getNormalRanges(userConfig || undefined)

  if (initialLoading) {
    return <Loading fullScreen text="加载中..." />
  }

  if (!currentCycle) {
    return (
      <div style={{ 
        padding: '16px',
        paddingBottom: 'max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px))',
      }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} align="center">
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              24小时尿蛋白检测
            </div>
            <div style={{ color: 'var(--adm-color-text-secondary)', marginBottom: '24px', textAlign: 'center', lineHeight: '1.6' }}>
              <div>点击下方按钮开始新的检测周期</div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--adm-color-weak)' }}>
                提示：首次排尿不收集，之后的所有尿液都需收集
              </div>
            </div>
            <Button
              color="primary"
              size="large"
              onClick={handleStartCycle}
              loading={loading}
              block
            >
              开始检测周期
            </Button>
          </Space>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '16px',
      paddingBottom: 'max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px))',
    }}>
      {/* 周期信息卡片 */}
      <Card
        title={
          <div>
            <div>{currentCycle.status === 'ongoing' ? '检测周期进行中' : '检测周期已完成'}</div>
            <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)', marginTop: '4px' }}>
              开始时间: {formatDateTime(currentCycle.startTime)}
              {currentCycle.endTime && (
                <span> | 结束时间: {formatDateTime(currentCycle.endTime)}</span>
              )}
            </div>
          </div>
        }
        style={{ marginBottom: '16px' }}
      >
          <Space direction="vertical" style={{ width: '100%' }}>
            {currentCycle.status === 'ongoing' ? (
              <>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--adm-color-text-secondary)', marginBottom: '8px' }}>
                    剩余时间
                  </div>
                  <TimerDisplay startTime={currentCycle.startTime} />
                </div>
                <CycleProgress startTime={currentCycle.startTime} />
                <Button
                  color="danger"
                  size="small"
                  onClick={handleEndCycle}
                  loading={loading}
                  style={{ marginTop: '16px' }}
                >
                  结束检测周期
                </Button>
              </>
            ) : (
              <>
                <div style={{ color: 'var(--adm-color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                  检测周期已结束，您可以录入检测结果
                </div>
                <Button
                  color="primary"
                  size="large"
                  onClick={handleStartCycle}
                  loading={loading}
                  block
                >
                  开始新的检测周期
                </Button>
              </>
            )}
          </Space>
        </Card>

        {/* 统计卡片 */}
        <Card title="统计信息" style={{ marginBottom: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>总排尿次数:</span>
              <span style={{ fontWeight: 'bold' }}>{currentCycle.urinationRecords.length} 次</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>总尿量:</span>
              <span style={{ fontWeight: 'bold' }}>{formatVolume(currentCycle.totalVolume, userConfig?.unit.volume)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>平均每次尿量:</span>
              <span style={{ fontWeight: 'bold' }}>{formatVolume(averageVolume, userConfig?.unit.volume)}</span>
            </div>
            {currentCycle.testResults && currentCycle.testResults.proteinTotal24h !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>24小时总蛋白:</span>
                <span
                  style={{
                    fontWeight: 'bold',
                    color: isAbnormal(
                      currentCycle.testResults.proteinTotal24h! * 1000,
                      0,
                      normalRanges.protein24h
                    )
                      ? 'red'
                      : 'inherit',
                  }}
                >
                  {warnIf(
                    isAbnormal(currentCycle.testResults.proteinTotal24h! * 1000, 0, normalRanges.protein24h),
                    `${currentCycle.testResults.proteinTotal24h?.toFixed(2)} g`
                  )}
                </span>
              </div>
            )}
          </Space>
        </Card>

        {/* 排尿记录 */}
        <Card
          title="排尿记录"
          extra={
            currentCycle.status === 'ongoing' ? (
              <Button
                size="small"
                color="primary"
                onClick={() => {
                  urinationForm.setFieldsValue({ time: new Date(), volume: '' })
                  setUrinationFormVisible(true)
                }}
              >
                添加记录
              </Button>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--adm-color-weak)' }}>周期已结束</span>
            )
          }
          style={{ marginBottom: '16px' }}
        >
          {currentCycle.urinationRecords.length === 0 ? (
            <EmptyState description="暂无排尿记录，点击右上角添加" />
          ) : (
            <List>
              {currentCycle.urinationRecords.map((record) => (
                <List.Item
                  key={record.id}
                  extra={
                    currentCycle.status === 'ongoing' ? (
                      <Button
                        size="small"
                        color="danger"
                        onClick={() => handleDeleteUrination(record.id)}
                      >
                        删除
                      </Button>
                    ) : null
                  }
                >
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--adm-color-text)', marginBottom: '4px' }}>
                      {formatVolume(record.volume, userConfig?.unit.volume)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)' }}>{formatDateTime(record.time)}</div>
                  </div>
                </List.Item>
              ))}
            </List>
          )}
        </Card>

        {/* 检测结果 */}
        <Card
          title="检测结果"
          extra={
            <Button
              size="small"
              color="primary"
              onClick={() => {
                if (currentCycle.testResults) {
                  testResultForm.setFieldsValue(currentCycle.testResults)
                }
                setTestResultFormVisible(true)
              }}
            >
              {currentCycle.testResults ? '编辑' : '录入'}
            </Button>
          }
        >
          {currentCycle.testResults ? (
            <TestResultDisplay testResults={currentCycle.testResults} userConfig={userConfig} />
          ) : (
            <EmptyState description="暂无检测结果，点击右上角录入" />
          )}
        </Card>

        {/* 添加排尿记录弹窗 */}
        <Popup
          visible={urinationFormVisible}
          onMaskClick={() => setUrinationFormVisible(false)}
          bodyStyle={{ 
            padding: '20px',
            maxHeight: '90dvh',
            overflowY: 'auto',
            paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 20px))',
          }}
          showCloseButton
          onClose={() => setUrinationFormVisible(false)}
        >
          {urinationFormVisible && (
            <Form
              form={urinationForm}
              onFinish={handleAddUrination}
              footer={
                <Button block type="submit" color="primary" loading={loading}>
                  保存
                </Button>
              }
            >
            <Form.Item
              name="time"
              label="排尿时间"
              rules={[{ required: true, message: '请选择排尿时间' }]}
            >
              <DatePicker precision="minute">
                {(value) => (value ? formatDateTime(value) : '请选择时间')}
              </DatePicker>
            </Form.Item>
            <Form.Item
              name="volume"
              label="尿量(ml)"
              rules={volumeRules}
            >
              <Input type="number" placeholder="请输入尿量" inputMode="decimal" />
            </Form.Item>
          </Form>
          )}
        </Popup>

        {/* 检测结果录入弹窗 */}
        <Popup
          visible={testResultFormVisible}
          onMaskClick={() => setTestResultFormVisible(false)}
          bodyStyle={{ 
            padding: '20px',
            maxHeight: '90dvh',
            overflowY: 'auto',
            paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 20px))',
          }}
          showCloseButton
          onClose={() => setTestResultFormVisible(false)}
        >
          {testResultFormVisible && (
            <Form
              form={testResultForm}
              onFinish={handleSaveTestResult}
              footer={
                <Button block type="submit" color="primary" loading={loading}>
                  保存
                </Button>
              }
            >
            <Form.Item
              name="protein24hQuantitative"
              label="24H尿蛋白定量(mg/L)"
              rules={protein24hRules}
            >
              <Input type="number" placeholder="请输入24H尿蛋白定量" inputMode="decimal" />
            </Form.Item>
            <Form.Item
              name="proteinRoutine"
              label="尿常规-尿蛋白"
              rules={[{ required: false }]}
            >
              <Selector options={URINE_ROUTINE_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="occultBlood"
              label="尿常规-潜血"
              rules={[{ required: false }]}
            >
              <Selector options={URINE_ROUTINE_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="creatinine"
              label="肌酐(μmol/L)"
              rules={creatinineRules}
            >
              <Input type="number" placeholder="请输入肌酐" inputMode="decimal" />
            </Form.Item>
            <Form.Item
              name="uricAcid"
              label="尿酸(μmol/L)"
              rules={uricAcidRules}
            >
              <Input type="number" placeholder="请输入尿酸" inputMode="decimal" />
            </Form.Item>
            <Form.Item
              name="specificGravity"
              label="尿比重"
              rules={specificGravityRules}
            >
              <Input type="number" step="0.001" placeholder="请输入尿比重(1.000-1.050)" inputMode="decimal" />
            </Form.Item>
            <Form.Item
              name="ph"
              label="pH值"
              rules={phRules}
            >
              <Input type="number" step="0.1" placeholder="请输入pH值(0-14)" inputMode="decimal" />
            </Form.Item>
          </Form>
          )}
        </Popup>
      </div>
    )
}

export default RecordPage

