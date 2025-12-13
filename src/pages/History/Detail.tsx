// AIGC START
import { Button, Card, List, Space, Toast } from 'antd-mobile'
import type { TestCycle } from '@/types'
import { formatDateTime } from '@/utils'
import { NORMAL_RANGES } from '@/constants'
import { urinationService } from '@/services/db'
import EmptyState from '@/components/Common/EmptyState'

interface HistoryDetailProps {
  cycle: TestCycle
  onClose: () => void
  onUpdate: () => void
}

const HistoryDetail = ({ cycle, onClose, onUpdate }: HistoryDetailProps) => {
  const handleDeleteUrination = async (id: string) => {
    try {
      await urinationService.delete(id)
      Toast.show({ content: '删除成功', icon: 'success' })
      onUpdate()
    } catch (error) {
      Toast.show({ content: '删除失败', icon: 'fail' })
    }
  }

  const isAbnormal = (value: number, min: number, max: number): boolean => {
    return value < min || value > max
  }

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
            <span style={{ fontWeight: 'bold' }}>{cycle.totalVolume} ml</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>排尿次数:</span>
            <span style={{ fontWeight: 'bold' }}>{cycle.urinationRecords.length} 次</span>
          </div>
        </Space>
      </Card>

      {/* 检测结果 */}
      {cycle.testResults && (
        <Card title="检测结果" style={{ marginBottom: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>尿蛋白:</span>
              <span>{cycle.testResults.protein} mg/L</span>
            </div>
            {cycle.testResults.proteinTotal24h && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>24h总蛋白:</span>
                <span
                  style={{
                    fontWeight: 'bold',
                    color: isAbnormal(
                      cycle.testResults.proteinTotal24h * 1000,
                      0,
                      NORMAL_RANGES.PROTEIN_24H
                    )
                      ? 'red'
                      : 'inherit',
                  }}
                >
                  {cycle.testResults.proteinTotal24h.toFixed(2)} g
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>肌酐:</span>
              <span
                style={{
                  color: isAbnormal(
                    cycle.testResults.creatinine,
                    NORMAL_RANGES.CREATININE_MIN,
                    NORMAL_RANGES.CREATININE_MAX
                  )
                    ? 'red'
                    : 'inherit',
                }}
              >
                {cycle.testResults.creatinine} μmol/L
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>尿比重:</span>
              <span
                style={{
                  color: isAbnormal(
                    cycle.testResults.specificGravity,
                    NORMAL_RANGES.SPECIFIC_GRAVITY_MIN,
                    NORMAL_RANGES.SPECIFIC_GRAVITY_MAX
                  )
                    ? 'red'
                    : 'inherit',
                }}
              >
                {cycle.testResults.specificGravity}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>pH值:</span>
              <span
                style={{
                  color: isAbnormal(
                    cycle.testResults.ph,
                    NORMAL_RANGES.PH_MIN,
                    NORMAL_RANGES.PH_MAX
                  )
                    ? 'red'
                    : 'inherit',
                }}
              >
                {cycle.testResults.ph}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              检测时间: {formatDateTime(cycle.testResults.testedAt)}
            </div>
          </Space>
        </Card>
      )}

      {/* 排尿记录 */}
      <Card title="排尿记录">
        {cycle.urinationRecords.length === 0 ? (
          <EmptyState description="暂无排尿记录" />
        ) : (
          <List>
            {cycle.urinationRecords.map((record, index) => (
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
                  <div>
                    第{index + 1}次 - {formatDateTime(record.time)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{record.volume} ml</div>
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
// AIGC END

