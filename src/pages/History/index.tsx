import { useState, useEffect } from 'react'
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
import { formatDateTime, calculateProteinTotal24h } from '@/utils'
import { getNormalRanges } from '@/utils/normalRanges'
import HistoryDetail from './Detail'
import HistoryChart from './Chart'
import Loading from '@/components/Common/Loading'
import EmptyState from '@/components/Common/EmptyState'

const HistoryPage = () => {
  const [cycles, setCycles] = useState<TestCycle[]>([])
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null)
  const [loading, setLoading] = useState(false)
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
      await loadCycles()
    }
    loadData()
  }, [])

  const loadCycles = async () => {
    setLoading(true)
    try {
      const allCycles = await cycleService.getAll()
      setCycles(allCycles)
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
        await loadCycles()
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
      setEditingCycle(cycle)
      setManualFormVisible(true)
      // 填充表单数据
      setTimeout(() => {
        const startTimeValue = new Date(cycle.startTime)
        manualForm.setFieldsValue({
          startTime: startTimeValue,
          totalVolume: cycle.totalVolume,
          protein24hQuantitative: cycle.testResults?.protein24hQuantitative,
          proteinTotal24h: cycle.testResults?.proteinTotal24h,
          proteinRoutine: cycle.testResults?.proteinRoutine,
          occultBlood: cycle.testResults?.occultBlood,
          creatinine: cycle.testResults?.creatinine,
          specificGravity: cycle.testResults?.specificGravity,
          ph: cycle.testResults?.ph,
        })
      }, 100)
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
        proteinTotal24h = calculateProteinTotal24h(values.protein24hQuantitative, values.totalVolume)
      }

      const testResult: TestResult = {
        protein24hQuantitative: values.protein24hQuantitative,
        proteinTotal24h,
        proteinRoutine: values.proteinRoutine,
        occultBlood: values.occultBlood,
        creatinine: values.creatinine,
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
      await loadCycles()
    } catch (error) {
      Toast.show({ content: editingCycle ? '更新失败' : '保存失败', icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  // 过滤数据
  const getFilteredCycles = () => {
    if (timeRange === 'all') return cycles
    const months = timeRange === '3months' ? 3 : 6
    const cutoffDate = dayjs().subtract(months, 'month')
    return cycles.filter((cycle) => dayjs(cycle.createdAt).isAfter(cutoffDate))
  }

  const filteredCycles = getFilteredCycles()
  const normalRanges = getNormalRanges(userConfig || undefined)

  return (
    <div style={{ 
      padding: '16px', 
      paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
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
      {loading && filteredCycles.length === 0 ? (
        <Loading text="加载历史记录..." />
      ) : filteredCycles.length === 0 ? (
        <Card>
          <EmptyState description="暂无历史记录，去记录页面开始检测吧" />
        </Card>
      ) : (
        <List>
          {filteredCycles.map((cycle) => (
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
                <div style={{ fontSize: '12px', color: '#999' }}>
                  总尿量: {cycle.totalVolume} ml | 排尿次数: {cycle.urinationRecords.length} 次
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
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  状态: {cycle.status === 'ongoing' ? '进行中' : cycle.status === 'manual' ? '手动录入' : '已完成'}
                  {cycle.status === 'manual' && (
                    <span style={{ 
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
          maxHeight: '90vh', 
          overflowY: 'auto',
          paddingTop: 'max(16px, calc(env(safe-area-inset-top, 0px) + 16px))',
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
          maxHeight: '90vh', 
          overflowY: 'auto', 
          padding: '16px',
          paddingTop: 'max(16px, calc(env(safe-area-inset-top, 0px) + 16px))',
          paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
        }}
        showCloseButton
        onClose={() => setChartVisible(false)}
      >
        <HistoryChart cycles={filteredCycles} />
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
          maxHeight: '90vh',
          overflowY: 'auto',
          paddingTop: 'max(20px, calc(env(safe-area-inset-top, 0px) + 20px))',
          paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 20px))',
        }}
        showCloseButton
        onClose={() => {
          setManualFormVisible(false)
          setEditingCycle(null)
          manualForm.resetFields()
        }}
      >
        {manualFormVisible && (
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
                  border: '1px solid #e5e5e5',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#fff',
                }}
              >
                {startTime 
                  ? formatDateTime(startTime instanceof Date ? startTime : new Date(startTime))
                  : <span style={{ color: '#999' }}>请选择时间</span>}
              </div>
            </Form.Item>
            <Form.Item
              name="totalVolume"
              label="总尿量(ml)"
              rules={[
                { required: true, message: '请输入总尿量' },
                { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的数字' },
                { 
                  validator: (_, value) => {
                    if (!value || Number(value) > 0) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('总尿量必须大于0'))
                  }
                },
              ]}
            >
              <Input 
                type="number" 
                placeholder="请输入总尿量" 
                inputMode="decimal"
                onChange={(value) => {
                  // 自动计算24小时总蛋白量
                  const protein24h = manualForm.getFieldValue('protein24hQuantitative')
                  if (protein24h && value) {
                    const calculated = calculateProteinTotal24h(Number(protein24h), Number(value))
                    const currentProteinTotal = manualForm.getFieldValue('proteinTotal24h')
                    // 只有当用户没有手动修改过时才自动计算
                    if (!currentProteinTotal || currentProteinTotal === calculateProteinTotal24h(protein24h, manualForm.getFieldValue('totalVolume') || 0)) {
                      manualForm.setFieldsValue({ proteinTotal24h: calculated })
                    }
                  }
                }}
              />
            </Form.Item>
            <Form.Item
              name="protein24hQuantitative"
              label="24H尿蛋白定量(mg/L)"
              rules={[
                { required: true, message: '请输入24H尿蛋白定量' },
                { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的数字' },
                { 
                  validator: (_, value) => {
                    if (!value || Number(value) >= 0) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('24H尿蛋白定量不能为负数'))
                  }
                },
              ]}
            >
              <Input 
                type="number" 
                placeholder="请输入24H尿蛋白定量" 
                inputMode="decimal"
                onChange={(value) => {
                  // 自动计算24小时总蛋白量
                  const totalVolume = manualForm.getFieldValue('totalVolume')
                  if (totalVolume && value) {
                    const calculated = calculateProteinTotal24h(Number(value), Number(totalVolume))
                    const currentProteinTotal = manualForm.getFieldValue('proteinTotal24h')
                    // 只有当用户没有手动修改过时才自动计算
                    if (!currentProteinTotal || currentProteinTotal === calculateProteinTotal24h(manualForm.getFieldValue('protein24hQuantitative') || 0, totalVolume)) {
                      manualForm.setFieldsValue({ proteinTotal24h: calculated })
                    }
                  }
                }}
              />
            </Form.Item>
            <Form.Item
              name="proteinTotal24h"
              label="24小时总蛋白量(g)"
              rules={[
                { required: false },
                { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的数字' },
                { 
                  validator: (_, value) => {
                    if (!value || Number(value) >= 0) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('24小时总蛋白量不能为负数'))
                  }
                },
              ]}
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
              <Selector
                options={[
                  { label: '阴性(-)', value: '阴性(-)' },
                  { label: '弱阳性(±)', value: '弱阳性(±)' },
                  { label: '1+', value: '1+' },
                  { label: '2+', value: '2+' },
                  { label: '3+', value: '3+' },
                  { label: '4+', value: '4+' },
                  { label: '++', value: '++' },
                  { label: '+++', value: '+++' },
                  { label: '++++', value: '++++' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="occultBlood"
              label="尿常规-潜血"
              rules={[{ required: false }]}
            >
              <Selector
                options={[
                  { label: '阴性(-)', value: '阴性(-)' },
                  { label: '弱阳性(±)', value: '弱阳性(±)' },
                  { label: '1+', value: '1+' },
                  { label: '2+', value: '2+' },
                  { label: '3+', value: '3+' },
                  { label: '4+', value: '4+' },
                  { label: '++', value: '++' },
                  { label: '+++', value: '+++' },
                  { label: '++++', value: '++++' },
                ]}
              />
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
        )}
      </Popup>
    </div>
  )
}

export default HistoryPage

