// 文件保存：原生走 SAF（系统"保存到"对话框，直接落盘），H5 回退浏览器下载。
//
// 背景：targetSdk 30+ 强制 scoped storage，应用无法直接写公共目录（Documents
// 路径在 Android 11+ 必然失败）。Android 上使用自定义插件 SafeFilePlugin 调起
// ACTION_CREATE_DOCUMENT，用户选定位置后由系统授权 URI 直接写入 —— 这是官方
// 推荐的外部存储持久化方式。浏览器/H5 环境回退到 a[download] 下载。
import { registerPlugin } from '@capacitor/core'
import type { Plugin } from '@capacitor/core'

export type SaveFileResult = 'saved' | 'canceled'

// Capacitor 原生平台检测（window.Capacitor 由原生桥注入）
function isNativePlatform(): boolean {
  return !!(window as unknown as { Capacitor?: { isNativePlatform: () => boolean } }).Capacitor?.isNativePlatform()
}

interface SafeFilePlugin extends Plugin {
  saveDocument(options: {
    fileName: string
    data: string // Base64
    mimeType: string
  }): Promise<{ status: 'saved' | 'canceled'; uri?: string }>
}

// 原生插件（仅 Android 存在；Web 上调用会 reject，走 H5 回退）
const SafeFile = registerPlugin<SafeFilePlugin>('SafeFile', {
  // Web 平台：提供一个永远 reject 的实现，触发 H5 回退
  web: () => {
    throw new Error('SafeFile 原生插件不可用')
  },
})

/**
 * 保存文件。
 * @param data 文件内容（UTF-8 文本或 Base64 均可）
 * @returns 'saved' | 'canceled'
 */
export async function saveFile(
  fileName: string,
  data: string,
  mimeType = 'application/octet-stream',
): Promise<SaveFileResult> {
  // 原生环境：走 SAF，data 需为 Base64
  if (isNativePlatform()) {
    try {
      const base64 = isBase64(data) ? data : utf8ToBase64(data)
      const result = await SafeFile.saveDocument({
        fileName,
        data: base64,
        mimeType,
      })
      return result.status === 'saved' ? 'saved' : 'canceled'
    } catch (e) {
      console.error('[fileSave] SAF 保存失败:', e)
      throw e
    }
  }

  // H5 环境：浏览器下载
  const blob = dataToBlob(data, mimeType)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'saved'
}

// 判断字符串是否已是 Base64（base64 字符集 + 长度合法 + 无换行）
function isBase64(s: string): boolean {
  if (s.length === 0 || s.length % 4 !== 0) return false
  return /^[A-Za-z0-9+/]+={0,2}$/.test(s.trim())
}

// UTF-8 字符串 → Base64
function utf8ToBase64(s: string): string {
  // 先编码为 UTF-8 字节，再转 Base64（避免 btoa 对非 Latin1 字符抛异常）
  const bytes = new TextEncoder().encode(s)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

// 数据 → Blob（H5 下载用）。Base64 解码，否则按 UTF-8 文本处理
function dataToBlob(data: string, mimeType: string): Blob {
  if (isBase64(data)) {
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type: mimeType })
  }
  return new Blob([data], { type: mimeType })
}
