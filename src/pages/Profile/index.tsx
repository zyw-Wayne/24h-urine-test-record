import { useState, useEffect } from 'react'
import {
  Card,
  List,
  Button,
  Form,
  Input,
  Toast,
  Dialog,
  Space,
  Selector,
  Popup,
} from 'antd-mobile'
import { exportToExcel } from '@/services/export'
import { exportBackup, importBackup } from '@/services/backup'
import { cycleService, configService } from '@/services/db'
import type { SaveFileResult } from '@/services/fileSave'
import { DEFAULT_USER_CONFIG, APP_VERSION } from '@/constants'
import type { UserConfig } from '@/types'

const ProfilePage = () => {
  const [config, setConfig] = useState<UserConfig>(DEFAULT_USER_CONFIG)
  const [loading, setLoading] = useState(false)
  const [configFormVisible, setConfigFormVisible] = useState(false)
  const [configForm] = Form.useForm()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const userConfig = await configService.get()
      if (userConfig) {
        setConfig(userConfig)
      }
    } catch (error) {
      console.error('加载配置失败', error)
      Toast.show({ content: '加载配置失败', icon: 'fail' })
    }
  }

  // 弹窗关闭再打开时刷新表单值（通过 key 触发 Form 重建）
  useEffect(() => {
    if (configFormVisible && config) {
      configForm.setFieldsValue(config)
    }
  }, [configFormVisible, config, configForm])

  const handleSaveConfig = async (values: UserConfig) => {
    setLoading(true)
    try {
      // 表单已不再包含 unit.protein（该设置已移除），合并现有值防止覆盖丢失
      const merged: UserConfig = {
        ...values,
        unit: {
          ...config.unit,
          ...values.unit,
        },
      }
      await configService.save(merged)
      setConfig(merged)
      setConfigFormVisible(false)
      // 同步更新深色主题
      document.documentElement.setAttribute('data-prefers-color-scheme', values.theme)
      Toast.show({ content: '保存成功', icon: 'success' })
    } catch (error) {
      Toast.show({ content: '保存失败', icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  const exportResultToast = (label: '备份' | '导出', result: SaveFileResult) => {
    if (result === 'documents') {
      return `${label}成功，文件已保存到文档目录`
    }
    if (result === 'shared') {
      return `${label}成功，请在分享面板中选择保存位置`
    }
    return `${label}已生成，但未保存文件`
  }

  const handleExportExcel = async () => {
    setLoading(true)
    try {
      const result = await exportToExcel()
      Toast.show({ content: exportResultToast('导出', result), icon: 'success' })
    } catch (error) {
      Toast.show({ content: '导出失败: ' + String((error as Error)?.message || error).slice(0, 50), icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  const handleExportBackup = async () => {
    setLoading(true)
    try {
      const result = await exportBackup()
      Toast.show({ content: exportResultToast('备份', result), icon: 'success' })
    } catch (error) {
      Toast.show({ content: '备份失败: ' + String((error as Error)?.message || error).slice(0, 50), icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  const handleImportBackup = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setLoading(true)
      try {
        const result = await importBackup(file)
        Toast.show({ content: '恢复成功', icon: 'success' })
        if (result?.warnings?.length) {
          // 短暂延迟避免 Toast 叠加
          setTimeout(() => {
            Toast.show({ content: result.warnings[0], icon: 'info', duration: 3000 })
          }, 500)
        }
        await loadConfig()
      } catch (error) {
        Toast.show({ content: '恢复失败: ' + (error as Error).message, icon: 'fail' })
      } finally {
        setLoading(false)
      }
    }
    input.click()
  }

  const handleClearData = async () => {
    const result = await Dialog.confirm({
      content: '确定要清空所有数据吗？此操作不可恢复，请先备份数据！',
      confirmText: '确定清空',
      cancelText: '取消',
    })
    if (result) {
      const confirm = await Dialog.confirm({
        content: '再次确认：确定要清空所有数据吗？',
        confirmText: '确定',
        cancelText: '取消',
      })
      if (confirm) {
        setLoading(true)
        try {
          await cycleService.deleteAll()
          Toast.show({ content: '数据已清空', icon: 'success' })
        } catch (error) {
          Toast.show({ content: '清空失败', icon: 'fail' })
        } finally {
          setLoading(false)
        }
      }
    }
  }

  return (
    <div style={{ 
      padding: '16px',
      paddingBottom: 'max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px))',
    }}>
      {/* 个人信息 */}
      <Card title="个人信息" style={{ marginBottom: '16px' }}>
        <List>
          <List.Item
            extra={
              <Button size="small" onClick={() => setConfigFormVisible(true)}>
                编辑
              </Button>
            }
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>昵称</div>
              <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)' }}>{config.nickname}</div>
            </div>
          </List.Item>
          {config.gender && (
            <List.Item>
              <div>
                <div style={{ fontWeight: 'bold' }}>性别</div>
                <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)' }}>
                  {config.gender === 'male' ? '男' : '女'}
                </div>
              </div>
            </List.Item>
          )}
          {config.age && (
            <List.Item>
              <div>
                <div style={{ fontWeight: 'bold' }}>年龄</div>
                <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)' }}>{config.age} 岁</div>
              </div>
            </List.Item>
          )}
        </List>
      </Card>

      {/* 数据管理 */}
      <Card title="数据管理" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button block color="primary" onClick={handleExportExcel} loading={loading}>
            导出Excel
          </Button>
          <Button block color="primary" onClick={handleExportBackup} loading={loading}>
            备份数据
          </Button>
          <Button block color="primary" onClick={handleImportBackup} loading={loading}>
            恢复数据
          </Button>
          <Button block color="danger" onClick={handleClearData} loading={loading}>
            清空所有数据
          </Button>
        </Space>
      </Card>

      {/* 设置 */}
      <Card title="设置" style={{ marginBottom: '16px' }}>
        <List>
          <List.Item>
            <div>
              <div style={{ fontWeight: 'bold' }}>单位设置</div>
              <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)' }}>
                尿量: {config.unit.volume}
              </div>
            </div>
          </List.Item>
          <List.Item>
            <div>
              <div style={{ fontWeight: 'bold' }}>主题</div>
              <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)' }}>
                {config.theme === 'light' ? '浅色' : '深色'}
              </div>
            </div>
          </List.Item>
        </List>
      </Card>

      {/* 使用说明 */}
      <Card title="使用说明">
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--adm-color-text-secondary)' }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>检测流程：</strong>
            <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>点击"开始检测周期"开始24小时检测</li>
              <li>每次排尿后记录时间和尿量</li>
              <li>24小时后结束检测周期</li>
              <li>录入检测指标（尿蛋白、肌酐、尿比重、pH值）</li>
            </ol>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>注意事项：</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>首次排尿不收集，之后的所有尿液都需收集</li>
              <li>尿液需冷藏保存，避免细菌污染</li>
              <li>避免剧烈运动、高蛋白饮食</li>
              <li>确保尿液收集完整，避免遗漏</li>
            </ul>
          </div>
          <div>
            <strong>正常值参考：</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>24小时尿蛋白: &lt; 150 mg（男女通用）</li>
              <li>肌酐: 男性 53-106 μmol/L，女性 44-97 μmol/L</li>
              <li>尿比重: 1.003-1.030（男女通用）</li>
              <li>pH值: 4.6-8.0（男女通用）</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 关于 */}
      <Card title="关于" style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '14px', color: 'var(--adm-color-text-secondary)', textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>24小时尿蛋白检测记录系统</div>
          <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)' }}>Version {APP_VERSION}</div>
        </div>
      </Card>

      {/* 配置编辑弹窗 */}
      <Popup
        visible={configFormVisible}
        onMaskClick={() => setConfigFormVisible(false)}
        bodyStyle={{ 
          padding: '20px',
          maxHeight: '90dvh',
          overflowY: 'auto',
          paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 20px))',
        }}
        showCloseButton
        onClose={() => setConfigFormVisible(false)}
      >
        {configFormVisible && (
          <Form
            form={configForm}
            onFinish={handleSaveConfig}
            initialValues={config}
            footer={
              <Button block type="submit" color="primary" loading={loading}>
                保存
              </Button>
            }
          >
          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item
            name="gender"
            label="性别"
            help="用于判断肌酐及尿酸正常值范围"
          >
            <Selector
              options={[
                { label: '男', value: 'male' },
                { label: '女', value: 'female' },
              ]}
            />
          </Form.Item>
          {config.gender && (
            <div style={{ fontSize: '12px', color: 'var(--adm-color-weak)', marginTop: '-12px', marginBottom: '12px', textAlign: 'center' }}>
              肌酐正常值参考：{config.gender === 'male' ? '53-106 μmol/L（男性）' : '44-97 μmol/L（女性）'}
            </div>
          )}
          <Form.Item name="age" label="年龄">
            <Input type="number" placeholder="请输入年龄" />
          </Form.Item>
          <Form.Item
            name={['unit', 'volume']}
            label="尿量单位"
            rules={[{ required: true, message: '请选择单位' }]}
          >
            <Selector
              options={[
                { label: '毫升 (ml)', value: 'ml' },
                { label: '升 (L)', value: 'l' },
              ]}
            />
          </Form.Item>
          <Form.Item name="theme" label="主题" rules={[{ required: true, message: '请选择主题' }]}>
            <Selector
              options={[
                { label: '浅色', value: 'light' },
                { label: '深色', value: 'dark' },
              ]}
            />
          </Form.Item>
        </Form>
        )}
      </Popup>
    </div>
  )
}

export default ProfilePage

