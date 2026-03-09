'use server'

export type ActionState = {
  success: boolean
  message: string
  data?: {
    id: string
    customerId: string
    amount: number
    status: string
    createdAt: string
  }
} | null

export async function createInvoice(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const rawFormData = {
    customerId: formData.get('customerId') as string,
    amount: formData.get('amount') as string,
    status: formData.get('status') as string,
  }

  // 简单验证
  if (!rawFormData.customerId || !rawFormData.amount || !rawFormData.status) {
    return {
      success: false,
      message: '请填写所有必填字段',
    }
  }

  const amount = parseFloat(rawFormData.amount)
  if (isNaN(amount) || amount <= 0) {
    return {
      success: false,
      message: '金额必须是大于0的数字',
    }
  }

  // 模拟创建发票（实际场景中会写入数据库）
  const invoice = {
    id: `INV-${Date.now()}`,
    customerId: rawFormData.customerId,
    amount: amount,
    status: rawFormData.status,
    createdAt: new Date().toISOString(),
  }

  console.log('✅ Server Action 执行成功!')
  console.log('📝 创建的发票数据:', JSON.stringify(invoice, null, 2))

  // 这里可以添加:
  // - 数据库操作: await db.invoices.create(invoice)
  // - 缓存重新验证: revalidatePath('/invoices')
  // - 重定向: redirect('/invoices/list')

  return {
    success: true,
    message: `发票 ${invoice.id} 创建成功！`,
    data: invoice,
  }
}
