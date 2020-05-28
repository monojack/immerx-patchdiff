import { diff as Symbol_diff } from './symbols'

export function isDiff(v) {
  return (
    Array.isArray(v) &&
    Symbol_diff in v &&
    typeof v[Symbol_diff] === 'function' &&
    v[Symbol_diff]() === v
  )
}
