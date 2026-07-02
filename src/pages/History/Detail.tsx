import { Button, Card, List, Space, Toast, Dialog } from 'antd-mobile'
import { useState, useEffect } from 'react'
import type { TestCycle, UserConfig } from '@/types'
import { formatDateTime, formatVolume } from '@/utils'
import { configService, cycleService } from '@/services/db'
import { urinationService } from '@/services/db'
import EmptyState from '@/components/Common/EmptyState'
import TestResultDisplay from '@/components/Common/TestResultDisplay'

interface HistoryDetailProps {
  cycle: TestCycle
  onClose: () => void
  onUpdate: () => void
  onEdit?: () => void
}


const HistoryDetail = ({ cycle, onClose, onUpdate, onEdit }: HistoryDetailProps) => {
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


  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h3>检测详情</h3>
        <Space>
          {onEdit && (
            <Button size="small" color="primary" onClick={onEdit}>
              编辑
            </Button>
          )}
          <Button size="small" onClick={onClose}>
            关闭
          </Button>
        </Space>
      </div>

      {/* 周期信息 */}
      <Card title="周期信息" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>开始时间:</span>
            <span>{formatDateTime(currentCycle.startTime)}</span>
          </div>
          {currentCycle.endTime && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>结束时间:</span>
              <span>{formatDateTime(currentCycle.endTime)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>状态:</span>
            <span>
              {currentCycle.status === 'ongoing' ? '进行中' : currentCycle.status === 'manual' ? '手动录入' : '已完成'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>总尿量:</span>
            <span style={{ fontWeight: 'bold' }}>{formatVolume(currentCycle.totalVolume, userConfig?.unit.volume)}</span>
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
          <TestResultDisplay testResults={currentCycle.testResults} userConfig={userConfig} />
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
                  <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)' }}>
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

