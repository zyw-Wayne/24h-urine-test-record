// 统一文件保存逻辑：优先写入 Documents，失败则写入 Cache 并弹出系统分享面板
// Android 11+（targetSdk 30+）scoped storage 限制下，Documents 目录可能不可写，
// 因此回退到 Cache + Share 让用户选择保存位置。
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export type SaveFileResult = 'documents' | 'shared' | 'canceled'

// 判断分享是否被用户主动取消（Android 原生在取消时 reject "Share canceled"）
// 用户取消不等于失败，调用方应据此给出中性提示而非"失败"。
function isShareCanceled(error: unknown): boolean {
  if (!error) return false
  const message = typeof error === 'string' ? error : (error as Error)?.message || String(error)
  return /cancel/i.test(message)
}

export async function saveFile(fileName: string, data: string): Promise<SaveFileResult> {
  // 优先写入 Documents（部分 Android 版本支持）
  try {
    await Filesystem.writeFile({
      path: fileName,
      data,
      directory: Directory.Documents,
    })
    return 'documents'
  } catch (e) {
    // Documents 不可写（Android 11+ 限制）属预期回退；但磁盘满/权限等系统错误
    // 不应被静默吞掉，记录原始错误便于排查根因
    console.warn('[fileSave] Documents 写入失败，回退到 Cache+Share:', e)
  }

  // 回退：写入缓存 → 分享
  const result = await Filesystem.writeFile({
    path: fileName,
    data,
    directory: Directory.Cache,
  })
  const fileUri = result.uri.startsWith('file://') ? result.uri : 'file://' + result.uri

  try {
    await Share.share({
      title: '保存文件',
      files: [fileUri],
      dialogTitle: '保存文件到',
    })
    return 'shared'
  } catch (e) {
    // 用户取消分享面板：文件未保存，但不属于"失败"
    if (isShareCanceled(e)) {
      return 'canceled'
    }
    throw e
  }
}
