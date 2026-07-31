import { useMemo } from 'react'
import { Card, Space } from 'antd-mobile'
import { Line, Bar } from 'react-chartjs-2'
import EmptyState from '@/components/Common/EmptyState'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { TestCycle } from '@/types'
import { formatDate } from '@/utils'
import { convertRoutineValue, getRoutineLabel, ROUTINE_VALUE_TO_LABEL } from '@/utils'
import type { TooltipItem, Tick } from 'chart.js'

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface HistoryChartProps {
  cycles: TestCycle[]
}

const HistoryChart = ({ cycles }: HistoryChartProps) => {
  // useMemo 缓存所有 chart 数据，避免 cycles 引用变化时重复计算触发 Chart.js 重复初始化
  const {
    hasProtein24h,
    hasCreatinine,
    hasUricAcid,
    protein24hQuantitativeChartData,
    proteinRoutineChartData,
    occultBloodChartData,
    creatinineChartData,
    uricAcidChartData,
    chartOptions,
    routineChartOptions,
  } = useMemo(() => {
    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

    const labels = sortedCycles.map((cycle) => formatDate(cycle.startTime))
    // 仅把缺失值（undefined/null）转为 null，0 值保留显示（0 本身可能是异常值，不应被隐藏）
    const protein24hQuantitative = sortedCycles.map((cycle) => {
      const v = cycle.testResults?.protein24hQuantitative
      return v === undefined || v === null ? null : v
    })
    const creatinines = sortedCycles.map((cycle) => {
      const v = cycle.testResults?.creatinine
      return v === undefined || v === null ? null : v
    })
    const proteinRoutineValues = sortedCycles
      .map((cycle) => convertRoutineValue(cycle.testResults?.proteinRoutine))
    const occultBloodValues = sortedCycles
      .map((cycle) => convertRoutineValue(cycle.testResults?.occultBlood))

    const uricAcids = sortedCycles.map((cycle) => {
      const v = cycle.testResults?.uricAcid
      return v === undefined || v === null ? null : v
    })

    const hasUricAcid = uricAcids.some((v: number | null) => v !== null)

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const },
        title: { display: false },
      },
      scales: { y: { beginAtZero: true } },
    }

    const routineChartOptions = {
      ...chartOptions,
      plugins: {
        ...chartOptions.plugins,
        tooltip: {
          callbacks: {
            label(context: TooltipItem<'bar'>) {
              const value = context.parsed.y
              return `${context.dataset.label}: ${getRoutineLabel(value)}`
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            callback(value: number | string, _index: number, _ticks: Tick[]) {
              const numValue = typeof value === 'number' ? value : Number(value)
              return ROUTINE_VALUE_TO_LABEL[numValue] || value
            },
          },
        },
      },
    }

    return {
      hasProtein24h: protein24hQuantitative.some((v: number | null) => v !== null),
      hasCreatinine: creatinines.some((v: number | null) => v !== null),
      hasUricAcid,
      protein24hQuantitativeChartData: {
        labels,
        datasets: [{
          label: '24H尿蛋白定量 (mg/L)',
          data: protein24hQuantitative,
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          tension: 0.1,
        }],
      },
      proteinRoutineChartData: {
        labels,
        datasets: [{
          label: '尿常规-尿蛋白',
          data: proteinRoutineValues,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
        }],
      },
      occultBloodChartData: {
        labels,
        datasets: [{
          label: '尿常规-潜血',
          data: occultBloodValues,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        }],
      },
      creatinineChartData: {
        labels,
        datasets: [{
          label: '肌酐 (μmol/L)',
          data: creatinines,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1,
        }],
      },
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
      chartOptions,
      routineChartOptions,
    }
  }, [cycles])

  if (cycles.length === 0) {
    return <EmptyState description="暂无数据可显示" />
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h3>数据图表</h3>
      </div>

      <Space direction="vertical" style={{ width: '100%' }}>
        {hasProtein24h && (
          <Card title="24H尿蛋白定量趋势">
            <div style={{ height: '250px' }}>
              <Line data={protein24hQuantitativeChartData} options={chartOptions} />
            </div>
          </Card>
        )}

        <Card title="尿常规-尿蛋白趋势">
          <div style={{ height: '250px' }}>
            {proteinRoutineChartData.datasets[0].data.some((v: number | null) => v !== null) ? (
              <Bar data={proteinRoutineChartData} options={routineChartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--adm-color-weak)', fontSize: '14px' }}>
                暂无数据，请先录入检测结果中的"尿常规-尿蛋白"字段
              </div>
            )}
          </div>
        </Card>

        {hasCreatinine && (
          <Card title="肌酐趋势">
            <div style={{ height: '250px' }}>
              <Line data={creatinineChartData} options={chartOptions} />
            </div>
          </Card>
        )}

        {hasUricAcid && (
          <Card title="尿酸趋势">
            <div style={{ height: '250px' }}>
              <Line data={uricAcidChartData} options={chartOptions} />
            </div>
          </Card>
        )}

        <Card title="尿常规-潜血趋势">
          <div style={{ height: '250px' }}>
            {occultBloodChartData.datasets[0].data.some((v: number | null) => v !== null) ? (
              <Bar data={occultBloodChartData} options={routineChartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--adm-color-weak)', fontSize: '14px' }}>
                暂无数据，请先录入检测结果中的"尿常规-潜血"字段
              </div>
            )}
          </div>
        </Card>
      </Space>
    </div>
  )
}

export default HistoryChart
