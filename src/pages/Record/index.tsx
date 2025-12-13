// AIGC START
import { useState, useEffect } from 'react'
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
} from 'antd-mobile'
import dayjs from 'dayjs'
import type { TestCycle, TestResult } from '@/types'
import { cycleService, urinationService } from '@/services/db'
import { formatDateTime, getRemainingTime, calculateProteinTotal24h } from '@/utils'
import { NORMAL_RANGES, CYCLE_DURATION } from '@/constants'
import Loading from '@/components/Common/Loading'
import EmptyState from '@/components/Common/EmptyState'

const RecordPage = () => {
  const [currentCycle, setCurrentCycle] = useState<TestCycle | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [urinationFormVisible, setUrinationFormVisible] = useState(false)
  const [testResultFormVisible, setTestResultFormVisible] = useState(false)
  const [remainingTime, setRemainingTime] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [urinationForm] = Form.useForm()
  const [testResultForm] = Form.useForm()

  // 加载当前检测周期
  useEffect(() => {
    loadCurrentCycle().finally(() => setInitialLoading(false))
  }, [])

  // 更新剩余时间
  useEffect(() => {
    if (currentCycle?.status === 'ongoing') {
      const timer = setInterval(() => {
        const time = getRemainingTime(currentCycle.startTime)
        setRemainingTime(time)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [currentCycle])

  const loadCurrentCycle = async () => {
    try {
      const cycle = await cycleService.getOngoing()
      setCurrentCycle(cycle)
      if (cycle) {
        const time = getRemainingTime(cycle.startTime)
        setRemainingTime(time)
      }
    } catch (error) {
      Toast.show({ content: '加载数据失败', icon: 'fail' })
    }
  }

  // 开始新的检测周期
  const handleStartCycle = async () => {
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

    setLoading(true)
    try {
      await cycleService.update(currentCycle.id, {
        status: 'completed',
        endTime: new Date().toISOString(),
      })
      Toast.show({ content: '检测周期已结束', icon: 'success' })
      setCurrentCycle(null)
    } catch (error) {
      Toast.show({ content: '结束检测周期失败', icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  // 添加排尿记录
  const handleAddUrination = async (values: { time: Date | string; volume: number }) => {
    if (!currentCycle) return

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
    protein: number
    creatinine: number
    specificGravity: number
    ph: number
  }) => {
    if (!currentCycle) return

    setLoading(true)
    try {
      const proteinTotal24h = calculateProteinTotal24h(values.protein, currentCycle.totalVolume)
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

  // 计算进度
  const getProgress = () => {
    if (!currentCycle) return 0
    const start = dayjs(currentCycle.startTime)
    const now = dayjs()
    const elapsed = now.diff(start)
    return Math.min((elapsed / CYCLE_DURATION) * 100, 100)
  }

  // 计算平均尿量
  const getAverageVolume = () => {
    if (!currentCycle || currentCycle.urinationRecords.length === 0) return 0
    return Math.round(currentCycle.totalVolume / currentCycle.urinationRecords.length)
  }

  // 检查异常值
  const isAbnormal = (value: number, min: number, max: number): boolean => {
    return value < min || value > max
  }

  if (initialLoading) {
    return <Loading fullScreen text="加载中..." />
  }

  if (!currentCycle) {
    return (
      <div style={{ padding: '16px', paddingBottom: '80px' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} align="center">
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              24小时尿蛋白检测
            </div>
            <div style={{ color: '#666', marginBottom: '24px', textAlign: 'center', lineHeight: '1.6' }}>
              <div>点击下方按钮开始新的检测周期</div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>
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
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* 周期信息卡片 */}
      <Card
        title={
          <div>
            <div>检测周期进行中</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              开始时间: {formatDateTime(currentCycle.startTime)}
            </div>
          </div>
        }
        style={{ marginBottom: '16px' }}
      >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                剩余时间
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {remainingTime.hours}小时 {remainingTime.minutes}分钟 {remainingTime.seconds}秒
              </div>
            </div>
            <ProgressBar percent={getProgress()} style={{ marginTop: '16px' }} />
            <Button
              color="danger"
              size="small"
              onClick={handleEndCycle}
              loading={loading}
              style={{ marginTop: '16px' }}
            >
              结束检测周期
            </Button>
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
              <span style={{ fontWeight: 'bold' }}>{currentCycle.totalVolume} ml</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>平均每次尿量:</span>
              <span style={{ fontWeight: 'bold' }}>{getAverageVolume()} ml</span>
            </div>
            {currentCycle.testResults && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>24小时总蛋白:</span>
                <span
                  style={{
                    fontWeight: 'bold',
                    color: isAbnormal(
                      currentCycle.testResults.proteinTotal24h! * 1000,
                      0,
                      NORMAL_RANGES.PROTEIN_24H
                    )
                      ? 'red'
                      : 'inherit',
                  }}
                >
                  {currentCycle.testResults.proteinTotal24h?.toFixed(2)} g
                </span>
              </div>
            )}
          </Space>
        </Card>

        {/* 排尿记录 */}
        <Card
          title="排尿记录"
          extra={
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
                    <Button
                      size="small"
                      color="danger"
                      onClick={() => handleDeleteUrination(record.id)}
                    >
                      删除
                    </Button>
                  }
                >
                  <div>
                    <div>{formatDateTime(record.time)}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{record.volume} ml</div>
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
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                尿蛋白: {currentCycle.testResults.protein} mg/L
                {currentCycle.testResults.proteinTotal24h && (
                  <span>
                    {' '}
                    (24h总蛋白:{' '}
                    <span
                      style={{
                        color: isAbnormal(
                          currentCycle.testResults.proteinTotal24h * 1000,
                          0,
                          NORMAL_RANGES.PROTEIN_24H
                        )
                          ? 'red'
                          : 'inherit',
                      }}
                    >
                      {currentCycle.testResults.proteinTotal24h.toFixed(2)} g
                    </span>
                    )
                  </span>
                )}
              </div>
              <div>
                肌酐:{' '}
                <span
                  style={{
                    color: isAbnormal(
                      currentCycle.testResults.creatinine,
                      NORMAL_RANGES.CREATININE_MIN,
                      NORMAL_RANGES.CREATININE_MAX
                    )
                      ? 'red'
                      : 'inherit',
                  }}
                >
                  {currentCycle.testResults.creatinine} μmol/L
                </span>
              </div>
              <div>
                尿比重:{' '}
                <span
                  style={{
                    color: isAbnormal(
                      currentCycle.testResults.specificGravity,
                      NORMAL_RANGES.SPECIFIC_GRAVITY_MIN,
                      NORMAL_RANGES.SPECIFIC_GRAVITY_MAX
                    )
                      ? 'red'
                      : 'inherit',
                  }}
                >
                  {currentCycle.testResults.specificGravity}
                </span>
              </div>
              <div>
                pH值:{' '}
                <span
                  style={{
                    color: isAbnormal(
                      currentCycle.testResults.ph,
                      NORMAL_RANGES.PH_MIN,
                      NORMAL_RANGES.PH_MAX
                    )
                      ? 'red'
                      : 'inherit',
                  }}
                >
                  {currentCycle.testResults.ph}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                检测时间: {formatDateTime(currentCycle.testResults.testedAt)}
              </div>
            </Space>
          ) : (
            <EmptyState description="暂无检测结果，点击右上角录入" />
          )}
        </Card>

        {/* 添加排尿记录弹窗 */}
        <Popup
          visible={urinationFormVisible}
          onMaskClick={() => setUrinationFormVisible(false)}
          bodyStyle={{ padding: '20px' }}
        >
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
              rules={[
                { required: true, message: '请输入尿量' },
                { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的数字' },
                { 
                  validator: (_, value) => {
                    if (!value || Number(value) > 0) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('尿量必须大于0'))
                  }
                },
              ]}
            >
              <Input type="number" placeholder="请输入尿量" inputMode="decimal" />
            </Form.Item>
          </Form>
        </Popup>

        {/* 检测结果录入弹窗 */}
        <Popup
          visible={testResultFormVisible}
          onMaskClick={() => setTestResultFormVisible(false)}
          bodyStyle={{ padding: '20px' }}
        >
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
              name="protein"
              label="尿蛋白(mg/L)"
              rules={[
                { required: true, message: '请输入尿蛋白' },
                { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的数字' },
                { 
                  validator: (_, value) => {
                    if (!value || Number(value) >= 0) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('尿蛋白不能为负数'))
                  }
                },
              ]}
            >
              <Input type="number" placeholder="请输入尿蛋白浓度" inputMode="decimal" />
            </Form.Item>
            <Form.Item
              name="creatinine"
              label="肌酐(μmol/L)"
              rules={[
                { required: true, message: '请输入肌酐' },
                { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的数字' },
                { 
                  validator: (_, value) => {
                    if (!value || Number(value) >= 0) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('肌酐不能为负数'))
                  }
                },
              ]}
            >
              <Input type="number" placeholder="请输入肌酐" inputMode="decimal" />
            </Form.Item>
            <Form.Item
              name="specificGravity"
              label="尿比重"
              rules={[
                { required: true, message: '请输入尿比重' },
                { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的数字' },
                { 
                  validator: (_, value) => {
                    const num = Number(value)
                    if (!value || (num >= 1.000 && num <= 1.050)) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('尿比重应在1.000-1.050之间'))
                  }
                },
              ]}
            >
              <Input type="number" step="0.001" placeholder="请输入尿比重(1.000-1.050)" inputMode="decimal" />
            </Form.Item>
            <Form.Item
              name="ph"
              label="pH值"
              rules={[
                { required: true, message: '请输入pH值' },
                { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的数字' },
                { 
                  validator: (_, value) => {
                    const num = Number(value)
                    if (!value || (num >= 0 && num <= 14)) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('pH值应在0-14之间'))
                  }
                },
              ]}
            >
              <Input type="number" step="0.1" placeholder="请输入pH值(0-14)" inputMode="decimal" />
            </Form.Item>
          </Form>
        </Popup>
      </div>
    )
}

export default RecordPage
// AIGC END

