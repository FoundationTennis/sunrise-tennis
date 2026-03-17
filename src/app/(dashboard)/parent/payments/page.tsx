import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'

export default async function ParentPaymentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  const familyId = userRole?.family_id
  if (!familyId) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="mt-4 text-sm text-gray-600">
          No family account linked. This is how parents see their payment history.
        </p>
      </div>
    )
  }

  const [
    { data: balance },
    { data: payments },
    { data: invoices },
  ] = await Promise.all([
    supabase.from('family_balance').select('balance_cents').eq('family_id', familyId).single(),
    supabase
      .from('payments')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('invoices')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const balanceCents = balance?.balance_cents ?? 0

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments &amp; Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">Your payment history and outstanding invoices.</p>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-center ${
          balanceCents < 0 ? 'border-red-200 bg-red-50' :
          balanceCents > 0 ? 'border-green-200 bg-green-50' :
          'border-gray-200 bg-white'
        }`}>
          <p className="text-xs font-medium text-gray-500">Account Balance</p>
          <p className={`text-2xl font-bold ${
            balanceCents < 0 ? 'text-red-600' :
            balanceCents > 0 ? 'text-green-600' :
            'text-gray-900'
          }`}>
            {formatCurrency(balanceCents)}
          </p>
        </div>
      </div>

      {/* Outstanding Invoices */}
      {invoices && invoices.filter(i => i.status !== 'paid' && i.status !== 'void').length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Outstanding Invoices</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Invoice</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices
                  .filter(i => i.status !== 'paid' && i.status !== 'void')
                  .map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.display_id}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount_cents)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        {payments && payments.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Method</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {payment.created_at ? formatDate(payment.created_at) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {payment.description || payment.category || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                      {payment.payment_method.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                      {formatCurrency(payment.amount_cents)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        payment.status === 'received' ? 'bg-green-100 text-green-700' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No payments recorded yet.</p>
        )}
      </div>
    </div>
  )
}
