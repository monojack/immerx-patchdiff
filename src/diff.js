import { objectOf } from './objectOf'

import { diff as Symbol_diff } from './symbols'

function set(path) {
  return value => {
    return target => {
      return objectOf(path, target)(value)
    }
  }
}

function get([head, ...rest]) {
  return target => {
    let value = target[head]

    if (rest.length > 0) {
      try {
        value = get(rest)(value)
      } catch (error) {
        value = undefined
        rest.length = 0
      }
    }
    return value
  }
}

export function diff(patches) {
  return prevState => {
    if (!Array.isArray(patches) || patches.length === 0) {
      return
    }

    if (patches.length === 1 && patches[0].path.length === 0) {
      // replace entire state tree
      const v = [prevState, patches[0].value]

      Object.defineProperty(v, Symbol_diff, {
        value: () => {
          return v
        },
      })

      return v
    }

    return (function () {
      let draft

      for (const patch of patches) {
        const v =
          patch.op === 'add'
            ? [patch.value]
            : patch.op === 'replace'
            ? [get(patch.path)(prevState), patch.value]
            : [get(patch.path)(prevState), 0, 0]

        Object.defineProperty(v, Symbol_diff, {
          value: () => {
            return v
          },
        })

        draft = set(patch.path)(v)(draft)
      }

      return draft
    })()
  }
}
