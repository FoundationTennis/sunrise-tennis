import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { RecordPaymentForm } from './record-payment-form'
import { ConfirmPaymentButton } from './confirm-payment-button'

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; filter?: string }>
}) {
  const { error, filter } = await searchParams
  const supabase = await createClient()

  const showAll = filter === 'all'

  let query = supabase
    .from('payments')
    .select('*, families:family_id(display_id, family_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!showAll) {
    // Default: show only pending payments that need action
    query = query.in('status', ['pending', 'received'])
  }

  const [{ data: payments }, { data: families }] = await Promise.all([
    query,
    supabase.from('families').select('id, display_id, family_name').eq('status', 'active').order('family_name'),
  ])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-600">Record payments and manage invoices.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/payments/invoices"
            className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700"
          >
            Invoices
          </Link>
          <Link
            href={showAll ? '/admin/payments' : '/admin/payments?filter=all'}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {showAll ? 'Recent' : 'Show all'}
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Payments table */}
      {payments && payments.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Family</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Method</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => {
                const family = payment.families as unknown as { display_id: string; family_name: string } | null
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {payment.created_at ? formatDate(payment.created_at) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <Link href={`/admin/families/${payment.family_id}`} className="hover:text-orange-600">
                        {family?.display_id} ({family?.family_name})
                      </Link>
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
                        payment.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {payment.status === 'pending' && (
                        <ConfirmPaymentButton paymentId={payment.id} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-500">No payments recorded yet.</p>
      )}

      {/* Record payment form */}
      <div className="mt-8">
        <RecordPaymentForm families={families ?? []} />
      </div>
    </div>
  )
}
