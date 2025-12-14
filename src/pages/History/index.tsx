import { useState, useEffect } from 'react'
import {
  Card,
  List,
  Button,
  Toast,
  Popup,
  Space,
  Dialog,
} from 'antd-mobile'
import { DeleteOutline } from 'antd-mobile-icons'
import dayjs from 'dayjs'
import type { TestCycle, UserConfig } from '@/types'
import { cycleService, configService } from '@/services/db'
import { formatDateTime } from '@/utils'
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
    setSelectedCycle(cycle)
    setDetailVisible(true)
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
                  状态: {cycle.status === 'ongoing' ? '进行中' : '已完成'}
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
    </div>
  )
}

export default HistoryPage

