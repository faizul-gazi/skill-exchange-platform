const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value) {
  const v = value?.trim() ?? ''
  if (!v) return 'Email is required.'
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.'
  return ''
}

export function validatePassword(value) {
  const v = value ?? ''
  if (!v) return 'Password is required.'
  if (v.length < 8) return 'Use at least 8 characters.'
  return ''
}

export function validateName(value) {
  const v = value?.trim() ?? ''
  if (!v) return 'Name is required.'
  if (v.length < 2) return 'Name must be at least 2 characters.'
  return ''
}

export function validateConfirmPassword(password, confirm) {
  if (!confirm) return 'Confirm your password.'
  if (password !== confirm) return 'Passwords do not match.'
  return ''
}
