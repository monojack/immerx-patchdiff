export function objectOf([key, ...rest], seed) {
  return value => {
    const obj =
      seed !== null && seed !== void 0 && typeof seed === 'object'
        ? seed
        : typeof key === 'number'
        ? []
        : {}

    obj[key] = rest.length > 0 ? objectOf(rest, obj[key])(value) : value
    return obj
  }
}
