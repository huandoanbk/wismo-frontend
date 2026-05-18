'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'

const SUBJECTS = [
  { value: 'general', label: 'General enquiry' },
  { value: 'support', label: 'Technical support' },
  { value: 'privacy', label: 'Privacy & data' },
  { value: 'security', label: 'Security' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
]

type Status = 'idle' | 'loading' | 'success' | 'error' | 'unavailable'

interface FormState {
  name: string
  email: string
  subject: string
  message: string
}

interface FieldErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

/** Map backend field error codes to display strings. */
function mapFieldError(field: string, code: 'required' | 'invalid' | string): string {
  if (code === 'required') {
    if (field === 'name') return 'Please enter your name.'
    if (field === 'email') return 'Please enter your email address.'
    if (field === 'subject') return 'Please select a subject.'
    if (field === 'message') return 'Please enter a message.'
  }
  if (field === 'email' && code === 'invalid') return 'Please enter a valid email address.'
  return 'This field is invalid.'
}

/** Client-side pre-validation before hitting the API. */
function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.name.trim()) errors.name = mapFieldError('name', 'required')
  if (!form.email.trim()) {
    errors.email = mapFieldError('email', 'required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = mapFieldError('email', 'invalid')
  }
  if (!form.message.trim()) errors.message = mapFieldError('message', 'required')
  return errors
}

function Field({
  id, label, required, error, children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-wismo-text">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputClass = (hasError?: string) =>
  `rounded-xl border px-4 py-2.5 text-sm text-wismo-text placeholder:text-wismo-text-light bg-white outline-none transition-colors disabled:opacity-60 ${
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
      : 'border-wismo-border focus:border-wismo-primary focus:ring-2 focus:ring-wismo-primary/20'
  }`

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: '', email: '', subject: 'general', message: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<Status>('idle')

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errors = validate(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setStatus('loading')
    setFieldErrors({})

    try {
      const res = await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setStatus('success')
        return
      }

      const data = await res.json().catch(() => ({}))

      // 400 validation_error — map field-level errors from backend
      if (res.status === 400 && data.fields) {
        const mapped: FieldErrors = {}
        for (const [field, code] of Object.entries(data.fields as Record<string, string>)) {
          mapped[field as keyof FieldErrors] = mapFieldError(field, code)
        }
        setFieldErrors(mapped)
        setStatus('idle')
        return
      }

      // 503 — service not configured
      if (res.status === 503) {
        setStatus('unavailable')
        return
      }

      // 502 or anything else — generic error, allow retry
      setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  // 503: hide form entirely per contract
  if (status === 'unavailable') {
    return (
      <div className="flex flex-1 justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold text-wismo-text mb-8">Contact</h1>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            The contact feature is temporarily unavailable. Please try again later or email us at{' '}
            <a href="mailto:hello@wismo.app" className="underline font-medium">hello@wismo.app</a>.
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-1 justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <div className="bg-white border border-wismo-border rounded-2xl px-8 py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-wismo-primary-light flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-wismo-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-wismo-text">Message sent</h2>
            <p className="text-sm text-wismo-text-muted max-w-sm mx-auto">
              Thank you for reaching out. We will get back to you at{' '}
              <span className="text-wismo-text font-medium">{form.email}</span> as soon as we can.
            </p>
            <button
              onClick={() => { setForm({ name: '', email: '', subject: 'general', message: '' }); setStatus('idle') }}
              className="text-sm text-wismo-primary hover:underline mt-2"
            >
              Send another message
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-wismo-text mb-2">Contact</h1>
        <p className="text-sm text-wismo-text-muted mb-8">
          Have a question, feedback, or need help? Send us a message and we will get back to you.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          <div className="grid sm:grid-cols-2 gap-5">
            <Field id="name" label="Name" required error={fieldErrors.name}>
              <input
                id="name" type="text" autoComplete="name"
                value={form.name} onChange={set('name')}
                disabled={status === 'loading'}
                placeholder="Your name"
                className={inputClass(fieldErrors.name)}
              />
            </Field>

            <Field id="email" label="Email" required error={fieldErrors.email}>
              <input
                id="email" type="email" autoComplete="email"
                value={form.email} onChange={set('email')}
                disabled={status === 'loading'}
                placeholder="you@example.com"
                className={inputClass(fieldErrors.email)}
              />
            </Field>
          </div>

          <Field id="subject" label="Subject" error={fieldErrors.subject}>
            <select
              id="subject"
              value={form.subject} onChange={set('subject')}
              disabled={status === 'loading'}
              className={`${inputClass(fieldErrors.subject)} cursor-pointer`}
            >
              {SUBJECTS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          <Field id="message" label="Message" required error={fieldErrors.message}>
            <textarea
              id="message" rows={6}
              value={form.message} onChange={set('message')}
              disabled={status === 'loading'}
              placeholder="What would you like to tell us?"
              className={`${inputClass(fieldErrors.message)} resize-none`}
            />
          </Field>

          {/* 502 / generic error */}
          {status === 'error' && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              Something went wrong sending your message. Please try again or email us at{' '}
              <a href="mailto:hello@wismo.app" className="underline">hello@wismo.app</a>.
            </p>
          )}

          <div className="flex items-center justify-between gap-4">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-wismo-primary text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-wismo-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {status === 'loading' ? 'Sending…' : 'Send message'}
            </button>
            <p className="text-xs text-wismo-text-light">
              We typically reply within 2 business days.
            </p>
          </div>

        </form>

        <div className="mt-10 pt-8 border-t border-wismo-border grid sm:grid-cols-3 gap-6 text-sm">
          {[
            { label: 'General', email: 'hello@wismo.app' },
            { label: 'Privacy & data', email: 'privacy@wismo.app' },
            { label: 'Security', email: 'security@wismo.app' },
          ].map(({ label, email }) => (
            <div key={email}>
              <p className="text-xs font-medium text-wismo-text-muted uppercase tracking-wide mb-1">{label}</p>
              <a href={`mailto:${email}`} className="text-wismo-primary hover:underline break-all">{email}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
