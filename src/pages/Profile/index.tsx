// AIGC START
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
import { DEFAULT_USER_CONFIG } from '@/constants'
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
        configForm.setFieldsValue(userConfig)
      }
    } catch (error) {
      console.error('加载配置失败', error)
    }
  }

  const handleSaveConfig = async (values: UserConfig) => {
    setLoading(true)
    try {
      await configService.save(values)
      setConfig(values)
      setConfigFormVisible(false)
      Toast.show({ content: '保存成功', icon: 'success' })
    } catch (error) {
      Toast.show({ content: '保存失败', icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    setLoading(true)
    try {
      await exportToExcel()
      Toast.show({ content: '导出成功', icon: 'success' })
    } catch (error) {
      Toast.show({ content: '导出失败', icon: 'fail' })
    } finally {
      setLoading(false)
    }
  }

  const handleExportBackup = async () => {
    setLoading(true)
    try {
      await exportBackup()
      Toast.show({ content: '备份成功', icon: 'success' })
    } catch (error) {
      Toast.show({ content: '备份失败', icon: 'fail' })
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
        await importBackup(file)
        Toast.show({ content: '恢复成功', icon: 'success' })
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
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
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
              <div style={{ fontSize: '12px', color: '#999' }}>{config.nickname}</div>
            </div>
          </List.Item>
          {config.gender && (
            <List.Item>
              <div>
                <div style={{ fontWeight: 'bold' }}>性别</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {config.gender === 'male' ? '男' : '女'}
                </div>
              </div>
            </List.Item>
          )}
          {config.age && (
            <List.Item>
              <div>
                <div style={{ fontWeight: 'bold' }}>年龄</div>
                <div style={{ fontSize: '12px', color: '#999' }}>{config.age} 岁</div>
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
              <div style={{ fontSize: '12px', color: '#999' }}>
                尿量: {config.unit.volume} | 蛋白: {config.unit.protein}
              </div>
            </div>
          </List.Item>
          <List.Item>
            <div>
              <div style={{ fontWeight: 'bold' }}>主题</div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {config.theme === 'light' ? '浅色' : '深色'}
              </div>
            </div>
          </List.Item>
        </List>
      </Card>

      {/* 使用说明 */}
      <Card title="使用说明">
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#666' }}>
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
              <li>24小时尿蛋白: &lt; 150 mg</li>
              <li>肌酐: 44-133 μmol/L</li>
              <li>尿比重: 1.003-1.030</li>
              <li>pH值: 4.6-8.0</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 关于 */}
      <Card title="关于" style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>24小时尿蛋白检测记录系统</div>
          <div style={{ fontSize: '12px', color: '#999' }}>Version 1.0.0</div>
        </div>
      </Card>

      {/* 配置编辑弹窗 */}
      <Popup
        visible={configFormVisible}
        onMaskClick={() => setConfigFormVisible(false)}
        bodyStyle={{ padding: '20px' }}
      >
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
          <Form.Item name="gender" label="性别">
            <Selector
              options={[
                { label: '男', value: 'male' },
                { label: '女', value: 'female' },
              ]}
            />
          </Form.Item>
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
          <Form.Item
            name={['unit', 'protein']}
            label="蛋白单位"
            rules={[{ required: true, message: '请选择单位' }]}
          >
            <Selector
              options={[
                { label: '毫克 (mg)', value: 'mg' },
                { label: '克 (g)', value: 'g' },
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
      </Popup>
    </div>
  )
}

export default ProfilePage
// AIGC END

