import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { CreateInvoiceForm } from './create-invoice-form'

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  const [{ data: invoices }, { data: families }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, families:family_id(display_id, family_name)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('families').select('id, display_id, family_name').eq('status', 'active').order('family_name'),
  ])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">Create and track invoices.</p>
        </div>
        <Link
          href="/admin/payments"
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Payments
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {invoices && invoices.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Family</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => {
                const family = invoice.families as unknown as { display_id: string; family_name: string } | null
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {invoice.display_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <Link href={`/admin/families/${invoice.family_id}`} className="hover:text-orange-600">
                        {family?.display_id} ({family?.family_name})
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount_cents)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        invoice.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {invoice.sent_at ? formatDate(invoice.sent_at) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-500">No invoices created yet.</p>
      )}

      <div className="mt-8">
        <CreateInvoiceForm families={families ?? []} />
      </div>
    </div>
  )
}
