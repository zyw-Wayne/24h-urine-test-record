import { Button, Card, List, Space, Toast, Dialog } from 'antd-mobile'
import { useState, useEffect } from 'react'
import type { TestCycle, UserConfig } from '@/types'
import { formatDateTime } from '@/utils'
import { getNormalRanges } from '@/utils/normalRanges'
import { urinationService, configService, cycleService } from '@/services/db'
import EmptyState from '@/components/Common/EmptyState'

interface HistoryDetailProps {
  cycle: TestCycle
  onClose: () => void
  onUpdate: () => void
}

const HistoryDetail = ({ cycle, onClose, onUpdate }: HistoryDetailProps) => {
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null)
  const [currentCycle, setCurrentCycle] = useState<TestCycle>(cycle)

  useEffect(() => {
    const loadConfig = async () => {
      const config = await configService.get()
      setUserConfig(config)
    }
    loadConfig()
  }, [])

  // 当传入的 cycle 变化时，更新当前周期数据
  useEffect(() => {
    setCurrentCycle(cycle)
  }, [cycle])

  // 重新加载当前周期数据
  const reloadCycle = async () => {
    try {
      const updatedCycle = await cycleService.getById(cycle.id)
      if (updatedCycle) {
        setCurrentCycle(updatedCycle)
      }
    } catch (error) {
      console.error('重新加载周期数据失败', error)
    }
  }

  const handleDeleteUrination = async (id: string) => {
    // 显示确认弹窗
    const result = await Dialog.confirm({
      title: '确认删除',
      content: '确定要删除这条排尿记录吗？此操作不可恢复。',
      confirmText: '确定删除',
      cancelText: '取消',
    })

    if (!result) return

    try {
      await urinationService.delete(id)
      Toast.show({ content: '删除成功', icon: 'success' })
      // 重新加载当前周期数据
      await reloadCycle()
      // 通知父组件更新列表
      onUpdate()
    } catch (error) {
      Toast.show({ content: '删除失败', icon: 'fail' })
    }
  }

  const isAbnormal = (value: number, min: number, max: number): boolean => {
    return value < min || value > max
  }

  const normalRanges = getNormalRanges(userConfig || undefined)

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h3>检测详情</h3>
        <Button size="small" onClick={onClose}>
          关闭
        </Button>
      </div>

      {/* 周期信息 */}
      <Card title="周期信息" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>开始时间:</span>
            <span>{formatDateTime(cycle.startTime)}</span>
          </div>
          {cycle.endTime && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>结束时间:</span>
              <span>{formatDateTime(cycle.endTime)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>状态:</span>
            <span>{cycle.status === 'ongoing' ? '进行中' : '已完成'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>总尿量:</span>
            <span style={{ fontWeight: 'bold' }}>{currentCycle.totalVolume} ml</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>排尿次数:</span>
            <span style={{ fontWeight: 'bold' }}>{currentCycle.urinationRecords.length} 次</span>
          </div>
        </Space>
      </Card>

      {/* 检测结果 */}
      {currentCycle.testResults && (
        <Card title="检测结果" style={{ marginBottom: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>24H尿蛋白定量:</span>
              <span>{currentCycle.testResults.protein24hQuantitative} mg/L</span>
            </div>
            {currentCycle.testResults.proteinTotal24h && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>24h总蛋白:</span>
                <span
                  style={{
                    fontWeight: 'bold',
                    color: isAbnormal(
                      currentCycle.testResults.proteinTotal24h * 1000,
                      0,
                      normalRanges.protein24h
                    )
                      ? 'red'
                      : 'inherit',
                  }}
                >
                  {currentCycle.testResults.proteinTotal24h.toFixed(2)} g
                </span>
              </div>
            )}
            {currentCycle.testResults.proteinRoutine && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>尿常规-尿蛋白:</span>
                <span style={{ fontWeight: 'bold' }}>{currentCycle.testResults.proteinRoutine}</span>
              </div>
            )}
            {currentCycle.testResults.occultBlood && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>尿常规-潜血:</span>
                <span style={{ fontWeight: 'bold' }}>{currentCycle.testResults.occultBlood}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>肌酐:</span>
              <span
                style={{
                  color: isAbnormal(
                    currentCycle.testResults.creatinine,
                    normalRanges.creatinine.min,
                    normalRanges.creatinine.max
                  )
                    ? 'red'
                    : 'inherit',
                }}
              >
                {currentCycle.testResults.creatinine} μmol/L
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>尿比重:</span>
              <span
                style={{
                  color: isAbnormal(
                    currentCycle.testResults.specificGravity,
                    normalRanges.specificGravity.min,
                    normalRanges.specificGravity.max
                  )
                    ? 'red'
                    : 'inherit',
                }}
              >
                {currentCycle.testResults.specificGravity}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>pH值:</span>
              <span
                style={{
                  color: isAbnormal(
                    currentCycle.testResults.ph,
                    normalRanges.ph.min,
                    normalRanges.ph.max
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
        </Card>
      )}

      {/* 排尿记录 */}
      <Card title="排尿记录">
        {currentCycle.urinationRecords.length === 0 ? (
          <EmptyState description="暂无排尿记录" />
        ) : (
          <List>
            {currentCycle.urinationRecords.map((record, index) => (
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
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                    {record.volume} ml
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    第{index + 1}次 - {formatDateTime(record.time)}
                  </div>
                </div>
              </List.Item>
            ))}
          </List>
        )}
      </Card>
    </div>
  )
}

export default HistoryDetail

