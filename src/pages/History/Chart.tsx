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
import { convertRoutineValue, getRoutineLabel, ROUTINE_VALUE_TO_LABEL } from '@/constants'

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
    protein24hQuantitativeChartData,
    proteinRoutineChartData,
    occultBloodChartData,
    creatinineChartData,
    comparisonChartData,
    chartOptions,
    routineChartOptions,
  } = useMemo(() => {
    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

    const labels = sortedCycles.map((cycle) => formatDate(cycle.startTime))
    const volumes = sortedCycles.map((cycle) => cycle.totalVolume)
    const proteins = sortedCycles
      .map((cycle) => (cycle.testResults?.proteinTotal24h || 0) * 1000)
      .map((v) => (v === 0 ? null : v))
    const protein24hQuantitative = sortedCycles
      .map((cycle) => cycle.testResults?.protein24hQuantitative || null)
      .map((v) => (v === 0 ? null : v))
    const creatinines = sortedCycles
      .map((cycle) => cycle.testResults?.creatinine || null)
      .map((v) => (v === 0 ? null : v))
    const proteinRoutineValues = sortedCycles
      .map((cycle) => convertRoutineValue(cycle.testResults?.proteinRoutine))
    const occultBloodValues = sortedCycles
      .map((cycle) => convertRoutineValue(cycle.testResults?.occultBlood))

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
            label(context: any) {
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
            stepSize: 0.5,
            callback(value: any) {
              return ROUTINE_VALUE_TO_LABEL[value] || value
            },
          },
        },
      },
    }

    return {
      hasProtein24h: protein24hQuantitative.some((v: number | null) => v !== null),
      hasCreatinine: creatinines.some((v: number | null) => v !== null),
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
      comparisonChartData: {
        labels,
        datasets: [
          { label: '总尿量 (ml)', data: volumes, backgroundColor: 'rgba(75, 192, 192, 0.5)' },
          { label: '24h总蛋白 (mg)', data: proteins, backgroundColor: 'rgba(255, 99, 132, 0.5)' },
          { label: '24H尿蛋白定量 (mg/L)', data: protein24hQuantitative, backgroundColor: 'rgba(255, 159, 64, 0.5)' },
          { label: '肌酐 (μmol/L)', data: creatinines, backgroundColor: 'rgba(54, 162, 235, 0.5)' },
        ],
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: '14px' }}>
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

        <Card title="尿常规-潜血趋势">
          <div style={{ height: '250px' }}>
            {occultBloodChartData.datasets[0].data.some((v: number | null) => v !== null) ? (
              <Bar data={occultBloodChartData} options={routineChartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: '14px' }}>
                暂无数据，请先录入检测结果中的"尿常规-潜血"字段
              </div>
            )}
          </div>
        </Card>

        <Card title="多指标对比">
          <div style={{ height: '300px' }}>
            <Bar data={comparisonChartData} options={chartOptions} />
          </div>
        </Card>
      </Space>
    </div>
  )
}

export default HistoryChart
