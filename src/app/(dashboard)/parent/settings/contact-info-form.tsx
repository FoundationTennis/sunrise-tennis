'use client'

import { updateContactInfo } from '../actions'

const inputClass = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500'

export function ContactInfoForm({
  primaryContact,
  secondaryContact,
  address,
}: {
  primaryContact: { name?: string; phone?: string; email?: string } | null
  secondaryContact: { name?: string; phone?: string; email?: string } | null
  address: string | null
}) {
  return (
    <form action={updateContactInfo} className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700">Primary Contact</h3>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact_name" className="block text-xs font-medium text-gray-500">Name</label>
            <input id="contact_name" name="contact_name" type="text" required defaultValue={primaryContact?.name ?? ''} className={inputClass} />
          </div>
          <div>
            <label htmlFor="contact_phone" className="block text-xs font-medium text-gray-500">Phone</label>
            <input id="contact_phone" name="contact_phone" type="tel" defaultValue={primaryContact?.phone ?? ''} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="contact_email" className="block text-xs font-medium text-gray-500">Email</label>
            <input id="contact_email" name="contact_email" type="email" defaultValue={primaryContact?.email ?? ''} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700">Secondary Contact (optional)</h3>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="secondary_name" className="block text-xs font-medium text-gray-500">Name</label>
            <input id="secondary_name" name="secondary_name" type="text" defaultValue={secondaryContact?.name ?? ''} className={inputClass} />
          </div>
          <div>
            <label htmlFor="secondary_phone" className="block text-xs font-medium text-gray-500">Phone</label>
            <input id="secondary_phone" name="secondary_phone" type="tel" defaultValue={secondaryContact?.phone ?? ''} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="secondary_email" className="block text-xs font-medium text-gray-500">Email</label>
            <input id="secondary_email" name="secondary_email" type="email" defaultValue={secondaryContact?.email ?? ''} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="address" className="block text-xs font-medium text-gray-500">Address</label>
        <input id="address" name="address" type="text" defaultValue={address ?? ''} className={inputClass} />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Save Changes
        </button>
      </div>
    </form>
  )
}
