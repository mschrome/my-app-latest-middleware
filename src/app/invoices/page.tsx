'use client'

import { useActionState } from 'react'
import { createInvoice, type ActionState } from './actions'

export default function Page() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createInvoice, null)

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: '24px' }}>创建发票 - Server Action Demo</h1>
      
      <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="customerId" style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            客户 ID
          </label>
          <input
            type="text"
            id="customerId"
            name="customerId"
            placeholder="请输入客户ID"
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        <div>
          <label htmlFor="amount" style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            金额
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            placeholder="请输入金额"
            min="0"
            step="0.01"
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        <div>
          <label htmlFor="status" style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            状态
          </label>
          <select
            id="status"
            name="status"
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
            }}
          >
            <option value="">请选择状态</option>
            <option value="pending">待处理</option>
            <option value="paid">已支付</option>
            <option value="overdue">已逾期</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '10px 20px',
            backgroundColor: isPending ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: isPending ? 'not-allowed' : 'pointer',
            marginTop: '8px',
          }}
        >
          {isPending ? '提交中...' : '创建发票'}
        </button>
      </form>

      {state && (
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: state.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${state.success ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: state.success ? '#155724' : '#721c24' }}>
            {state.success ? '✅ 提交成功' : '❌ 提交失败'}
          </h3>
          <p style={{ margin: 0, color: state.success ? '#155724' : '#721c24' }}>
            {state.message}
          </p>
          {state.success && state.data && (
            <pre style={{ 
              marginTop: '12px', 
              padding: '12px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '13px',
            }}>
              {JSON.stringify(state.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}