import { useState, useEffect, useRef } from 'react'
import {
  Card,
  List,
  Button,
  Toast,
  Popup,
  Space,
  Dialog,
  Form,
  Input,
  DatePicker,
  Selector,
} from 'antd-mobile'
import { DeleteOutline, AddOutline } from 'antd-mobile-icons'
import dayjs from 'dayjs'
import type { TestCycle, UserConfig, TestResult } from '@/types'
import { cycleService, configService } from '@/services/db'
import { formatDateTime, calculateProteinTotal24h, formatVolume } from '@/utils'
import { getNormalRanges } from '@/utils/normalRanges'
import { URINE_ROUTINE_OPTIONS } from '@/constants'
import { totalVolumeRules, protein24hRules, creatinineRules, specificGravityRules, phRules, proteinTotal24hRules, uricAcidRules, uricAcidRulesOptional } from '@/utils/validators'
import HistoryDetail from './Detail'
import HistoryChart from './Chart'
import Loading from '@/components/Common/Loading'
import EmptyState from '@/components/Common/EmptyState'

const HistoryPage = () => {
  const [cycles, setCycles] = useState<TestCycle[]>([])
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [selectedCycle, setSelectedCycle] = useState<TestCycle | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [chartVisible, setChartVisible] = useState(false)
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | 'all'>('all')
  const [manualFormVisible, setManualFormVisible] = useState(false)
  const [editingCycle, setEditingCycle] = useState<TestCycle | null>(null)
  const [manualForm] = Form.useForm()
  const startTime = Form.useWatch('startTime', manualForm)

  useEffect(() => {
    const loadData = async () => {
      const config = await configService.get()
      setUserConfig(config)
      await loadCycles('all')
      setInitialLoading(false)
    }
    loadData()
  }, [])

  // timeRange 变化时重新加载

  const loadCycles = async (range?: string) => {
    setLoading(true)
    try {
      const result = (range && range !== 'all')
        ? await cycleService.getByTimeRange(dayjs().subtract(range === '3months' ? 3 : 6, 'month').toISOString())
        : await cycleService.getAll()
      setCycles(result)
    } catch (error) {
      Toast.show({ content: '加载历史记录失败', icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const result = await Dialog.confirm({
      content: '确定要删除这条记录吗？此操作不可恢复。',
    })
    if (result) {
      setLoading(true)
      try {
        await cycleService.delete(id)
        await loadCycles(timeRange)
        Toast.show({ content: '删除成功', icon: 'success' })
      } catch (error) {
        Toast.show({ content: '删除失败', icon: 'fail' })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleViewDetail = (cycle: TestCycle) => {
    // 如果是手动录入的记录，打开编辑表单
    if (cycle.status === 'manual') {
      clearTimeout(timerRef.current)
      // 先设置表单值再打开弹窗，避免 setTimeout hack
      setEditingCycle(cycle)
      const startTimeValue = new Date(cycle.startTime)
      manualForm.setFieldsValue({
        startTime: startTimeValue,
        totalVolume: cycle.totalVolume,
        protein24hQuantitative: cycle.testResults?.protein24hQuantitative,
        proteinTotal24h: cycle.testResults?.proteinTotal24h,
        proteinRoutine: cycle.testResults?.proteinRoutine,
        occultBlood: cycle.testResults?.occultBlood,
        creatinine: cycle.testResults?.creatinine,
        uricAcid: cycle.testResults?.uricAcid,
        specificGravity: cycle.testResults?.specificGravity,
        ph: cycle.testResults?.ph,
      })
      setManualFormVisible(true)
    } else {
      // 正常记录显示详情
      setSelectedCycle(cycle)
      setDetailVisible(true)
    }
  }

  // 打开新增手动录入表单
  const handleAddManualRecord = () => {
    setEditingCycle(null)
    setManualFormVisible(true)
    manualForm.resetFields()
  }

  // 保存手动录入的数据
  const handleSaveManualRecord = async (values: {
    startTime: Date
    totalVolume: number
    protein24hQuantitative: number
    proteinTotal24h?: number
    proteinRoutine?: string
    occultBlood?: string
    creatinine: number
    uricAcid?: number
    specificGravity: number
    ph: number
  }) => {
    setLoading(true)
    try {
      const startTime = values.startTime instanceof Date 
        ? values.startTime.toISOString() 
        : values.startTime
      
      // 计算24小时总蛋白量（如果未手动输入）
      let proteinTotal24h = values.proteinTotal24h
      if (!proteinTotal24h && values.protein24hQuantitative && values.totalVolume) {
        proteinTotal24h = calculateProteinTotal24h(
          values.protein24hQuantitative,
          values.totalVolume,
          userConfig?.unit.volume || 'ml'
        )
      }

      const testResult: TestResult = {
        protein24hQuantitative: values.protein24hQuantitative,
        proteinTotal24h,
        proteinRoutine: values.proteinRoutine,
        occultBlood: values.occultBlood,
        creatinine: values.creatinine,
        uricAcid: values.uricAcid as number,
        specificGravity: values.specificGravity,
        ph: values.ph,
        testedAt: startTime,
      }

      if (editingCycle) {
        // 编辑模式：更新现有记录
        await cycleService.update(editingCycle.id, {
          startTime,
          endTime: dayjs(startTime).add(24, 'hour').toISOString(),
          totalVolume: values.totalVolume,
          testResults: testResult,
        })
        Toast.show({ content: '更新成功', icon: 'success' })
      } else {
        // 新增模式：创建新记录
        await cycleService.create({
          startTime,
          endTime: dayjs(startTime).add(24, 'hour').toISOString(),
          status: 'manual',
          totalVolume: values.totalVolume,
          urinationRecords: [],
          testResults: testResult,
        })
        Toast.show({ content: '保存成功', icon: 'success' })
      }

      setManualFormVisible(false)
      setEditingCycle(null)
      manualForm.resetFields()
      await loadCycles(timeRange)
    } catch (error) {
      Toast.show({ content: editingCycle ? '更新失败' : '保存失败', icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  // cycles 已由 loadCycles 根据 timeRange 在服务端过滤
  const normalRanges = getNormalRanges(userConfig || undefined)

  return (
    <div style={{ 
      padding: '16px',
      paddingBottom: 'max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px))',
    }}>
      {/* 时间筛选 */}
      <Card style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <Button
              size="small"
              color={timeRange === '3months' ? 'primary' : 'default'}
              onClick={() => setTimeRange('3months')}
              style={{ flex: 1 }}
            >
              最近三个月
            </Button>
            <Button
              size="small"
              color={timeRange === '6months' ? 'primary' : 'default'}
              onClick={() => setTimeRange('6months')}
              style={{ flex: 1 }}
            >
              最近半年
            </Button>
            <Button
              size="small"
              color={timeRange === 'all' ? 'primary' : 'default'}
              onClick={() => setTimeRange('all')}
              style={{ flex: 1 }}
            >
              全部
            </Button>
          </div>
          <Button
            size="small"
            color="primary"
            onClick={() => setChartVisible(true)}
            block
          >
            查看图表
          </Button>
          <Button
            size="small"
            color="primary"
            onClick={handleAddManualRecord}
            block
            style={{ marginTop: '8px' }}
          >
            <AddOutline style={{ marginRight: '4px' }} />
            添加历史记录
          </Button>
        </Space>
      </Card>

      {/* 历史记录列表 */}
      {initialLoading ? (
        <Loading text="加载历史记录..." />
      ) : cycles.length === 0 ? (
        <Card>
          <EmptyState description="暂无历史记录，去记录页面开始检测吧" />
        </Card>
      ) : (
        <List>
          {cycles.map((cycle) => (
            <List.Item
              key={cycle.id}
              onClick={() => handleViewDetail(cycle)}
              extra={
                <Button
                  size="small"
                  color="danger"
                  fill="none"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(cycle.id)
                  }}
                >
                  <DeleteOutline />
                </Button>
              }
            >
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {formatDateTime(cycle.startTime)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)' }}>
                  总尿量: {formatVolume(cycle.totalVolume, userConfig?.unit.volume)} | 排尿次数: {cycle.urinationRecords.length} 次
                  {cycle.testResults?.proteinTotal24h && (
                    <span>
                      {' '}
                      | 24h总蛋白:{' '}
                      <span
                        style={{
                          color:
                            cycle.testResults.proteinTotal24h * 1000 > normalRanges.protein24h
                              ? 'red'
                              : 'inherit',
                        }}
                      >
                        {cycle.testResults.proteinTotal24h.toFixed(2)} g
                      </span>
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)', marginTop: '4px' }}>
                  状态: {cycle.status === 'ongoing' ? '进行中' : cycle.status === 'manual' ? '手动录入' : '已完成'}
                  {cycle.status === 'manual' && (
                    <span className="manual-badge" style={{ 
                      marginLeft: '8px', 
                      padding: '2px 6px', 
                      backgroundColor: '#e6f7ff', 
                      color: '#1890ff',
                      borderRadius: '2px',
                      fontSize: '11px'
                    }}>
                      手动录入
                    </span>
                  )}
                </div>
              </div>
            </List.Item>
          ))}
        </List>
      )}

      {/* 详情弹窗 */}
      <Popup
        visible={detailVisible}
        onMaskClick={() => setDetailVisible(false)}
        bodyStyle={{ 
          maxHeight: '90dvh', 
          overflowY: 'auto',
          paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
        }}
        showCloseButton
        onClose={() => setDetailVisible(false)}
      >
        {selectedCycle && (
          <HistoryDetail
            cycle={selectedCycle}
            onClose={() => setDetailVisible(false)}
            onUpdate={loadCycles}
          />
        )}
      </Popup>

      {/* 图表弹窗 */}
      <Popup
        visible={chartVisible}
        onMaskClick={() => setChartVisible(false)}
        bodyStyle={{ 
          maxHeight: '90dvh', 
          overflowY: 'auto', 
          padding: '16px',
          paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
        }}
        showCloseButton
        onClose={() => setChartVisible(false)}
      >
        <HistoryChart cycles={cycles} />
      </Popup>

      {/* 手动录入表单弹窗 */}
      <Popup
        visible={manualFormVisible}
        onMaskClick={() => {
          setManualFormVisible(false)
          setEditingCycle(null)
          manualForm.resetFields()
        }}
        bodyStyle={{ 
          padding: '20px',
          maxHeight: '90dvh',
          overflowY: 'auto',
          paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 20px))',
        }}
        showCloseButton
        onClose={() => {
          setManualFormVisible(false)
          setEditingCycle(null)
          manualForm.resetFields()
        }}
      >
        <Form
          form={manualForm}
          onFinish={handleSaveManualRecord}
          footer={
              <Button block type="submit" color="primary" loading={loading}>
                {editingCycle ? '更新' : '保存'}
              </Button>
            }
          >
            <Form.Item
              name="startTime"
              label="开始时间"
              rules={[{ required: true, message: '请选择开始时间' }]}
            >
              <div
                onClick={async () => {
                  const currentValue = startTime || manualForm.getFieldValue('startTime')
                  const value = await DatePicker.prompt({
                    precision: 'minute',
                    defaultValue: currentValue ? (currentValue instanceof Date ? currentValue : new Date(currentValue)) : new Date(),
                  })
                  if (value) {
                    manualForm.setFieldsValue({ startTime: value })
                  }
                }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--adm-color-border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--adm-color-background)',
                }}
              >
                {startTime 
                  ? formatDateTime(startTime instanceof Date ? startTime : new Date(startTime))
                  : <span style={{ color: 'var(--adm-color-weak)' }}>请选择时间</span>}
              </div>
            </Form.Item>
            <Form.Item
              name="totalVolume"
              label="总尿量(ml)"
              rules={totalVolumeRules}
            >
              <Input 
                type="number" 
                placeholder="请输入总尿量" 
                inputMode="decimal"
                onChange={(value) => {
                  // 用 getFieldsValue 一次性读取所有字段的快照，避免逐次 getFieldValue 读到旧值
                  const fields = manualForm.getFieldsValue()
                  const newVolume = Number(value)
                  const oldVolume = Number(fields.totalVolume) || 0
                  const protein24h = fields.protein24hQuantitative
                  const currentProteinTotal = fields.proteinTotal24h
                  if (protein24h && newVolume > 0) {
                    const calculated = calculateProteinTotal24h(Number(protein24h), newVolume, userConfig?.unit.volume || 'ml')
                    // 比较旧计算结果：若相等则用户未手动修改 proteinTotal
                    if (!currentProteinTotal || currentProteinTotal === calculateProteinTotal24h(Number(protein24h), oldVolume, userConfig?.unit.volume || 'ml')) {
                      manualForm.setFieldsValue({ proteinTotal24h: calculated })
                    }
                  }
                }}
              />
            </Form.Item>
            <Form.Item
              name="protein24hQuantitative"
              label="24H尿蛋白定量(mg/L)"
              rules={protein24hRules}
            >
              <Input 
                type="number" 
                placeholder="请输入24H尿蛋白定量" 
                inputMode="decimal"
                onChange={(value) => {
                  const fields = manualForm.getFieldsValue()
                  const newProtein = Number(value)
                  const oldProtein = Number(fields.protein24hQuantitative) || 0
                  const totalVolume = Number(fields.totalVolume) || 0
                  const currentProteinTotal = fields.proteinTotal24h
                  if (totalVolume > 0 && newProtein >= 0) {
                    const calculated = calculateProteinTotal24h(newProtein, totalVolume, userConfig?.unit.volume || 'ml')
                    // 比较旧计算结果
                    if (!currentProteinTotal || currentProteinTotal === calculateProteinTotal24h(oldProtein, totalVolume, userConfig?.unit.volume || 'ml')) {
                      manualForm.setFieldsValue({ proteinTotal24h: calculated })
                    }
                  }
                }}
              />
            </Form.Item>
            <Form.Item
              name="proteinTotal24h"
              label="24小时总蛋白量(g)"
              rules={proteinTotal24hRules}
              extra="留空将自动计算，或手动输入覆盖"
            >
              <Input 
                type="number" 
                step="0.001"
                placeholder="自动计算或手动输入" 
                inputMode="decimal"
              />
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
              rules={editingCycle?.testResults?.uricAcid === undefined ? uricAcidRulesOptional : uricAcidRules}
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
      </Popup>
    </div>
  )
}

export default HistoryPage

