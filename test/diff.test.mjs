import test from 'ava'
import { produce, enablePatches } from 'immer'
import { diff } from '../src/diff.mjs'
import { isDiff } from '../src/isDiff.mjs'

enablePatches()

test('a single patch returns a single diff', t => {
  const res = diff({
    op: 'add',
    path: ['a', 'b'],
    value: 2,
  })({ a: {} })

  t.false(Array.isArray(res))
})

test('a list of patches returns a diffs list of the same size', t => {
  const patches = [
    {
      op: 'add',
      path: ['a', 'b'],
      value: 2,
    },
    {
      op: 'add',
      path: ['a', 'c'],
      value: [1, 2],
    },
  ]
  const res = diff(patches)({ a: {} })

  t.true(Array.isArray(res))
  t.is(patches.length, res.length)
})

test('add', t => {
  const res = diff({
    op: 'add',
    path: ['a', 'b'],
    value: 2,
  })({ a: {} })

  t.deepEqual(res, { a: { b: [2] } })
  t.true(isDiff(res.a.b))
  t.is(res.a.b.length, 1)
})

test('add in array', t => {
  const res = diff({
    op: 'add',
    path: [0, 0],
    value: 'a',
  })([])

  t.deepEqual(res, [[['a']]])
  t.true(isDiff(res[0][0]))
})

test('replace in array', t => {
  const res = diff({
    op: 'replace',
    path: [0],
    value: 'c',
  })(['a', 'b'])

  t.deepEqual(res, [['a', 'c']])
  t.true(isDiff(res[0]))
})

test('replace in nested array', t => {
  const res = diff({
    op: 'replace',
    path: [0, 1],
    value: 'c',
  })([['a', 'b']])

  t.deepEqual(res, [[, ['b', 'c']]])
  t.true(isDiff(res[0][1]))
})

test('multiple patches on arrays', t => {
  const res = diff([
    {
      op: 'replace',
      path: [0, 1],
      value: 'c',
    },
    {
      op: 'add',
      path: [1],
      value: 'd',
    },
  ])([['a', 'b']])

  t.deepEqual(res, [[[, ['b', 'c']]], [, ['d']]])
  t.true(isDiff(res[0][0][1]))
  t.true(isDiff(res[1][1]))
})

test('sparse add in array', t => {
  const res = diff({
    op: 'add',
    path: [1, 0],
    value: 'a',
  })([])

  t.deepEqual(res, [, [['a']]])
  t.true(isDiff(res[1][0]))
})

test('remove', t => {
  const res = diff({
    op: 'remove',
    path: ['a', 'b'],
  })({ a: { b: { c: 2 } } })

  t.deepEqual(res, { a: { b: [{ c: 2 }, 0, 0] } })
  t.true(isDiff(res.a.b))
  t.is(res.a.b.length, 3)
})

test('replace', t => {
  const res = diff({
    op: 'replace',
    path: ['a', 'b'],
    value: 3,
  })({ a: { b: { c: 2 } } })

  t.deepEqual(res, { a: { b: [{ c: 2 }, 3] } })
  t.true(isDiff(res.a.b))
  t.is(res.a.b.length, 2)
})

test('more patches', t => {
  const res = diff([
    {
      op: 'replace',
      path: ['a', 'b'],
      value: 3,
    },
    {
      op: 'add',
      path: ['a', 'foo'],
      value: { bar: 3 },
    },
  ])({ a: { b: { c: 2 } } })

  t.deepEqual(res, [{ a: { b: [{ c: 2 }, 3] } }, { a: { foo: [{ bar: 3 }] } }])

  t.true(isDiff(res[0].a.b))
  t.is(res[0].a.b.length, 2)

  t.true(isDiff(res[1].a.foo))
  t.is(res[1].a.foo.length, 1)
})

test('replace root', t => {
  const res = diff({
    op: 'replace',
    path: [],
    value: { a: { b: 2 } },
  })({})

  t.deepEqual(res, [{}, { a: { b: 2 } }])
  t.true(isDiff(res))
  t.is(res.length, 2)
})

test('no valid patch list', t => {
  const res1 = diff()({})
  const res2 = diff([])({})
  const res3 = diff(2)({})
  const res4 = diff(null)({})
  const res5 = diff()()

  t.is(res1, undefined)
  t.is(res2, undefined)
  t.is(res3, undefined)
  t.is(res4, undefined)
  t.is(res5, undefined)
})

test('throws if patch is badly formatted', t => {
  t.throws(() => diff([{}])({}))
})

// use immer to produce actual patches

const state = {
  a: { b: 2 },
  c: 'foo',
  d: ['bar', 'baz'],
  e: [{ f: 3 }, { f: 4 }],
  g: [
    [5, 6],
    [7, 8, 9, 10],
  ],
}

test('real immer patch :: remove last element from array property', t => {
  let patches

  produce(
    state,
    draft => {
      draft.d.splice(1, 1)
    },
    p => (patches = p),
  )

  const res = diff(patches)(state)

  t.deepEqual(res, [{ d: { length: [2, 1] } }])
  t.true(isDiff(res[0].d.length))
})

test('real immer patch :: first element from array property', t => {
  let patches

  produce(
    state,
    draft => {
      draft.d.splice(0, 1)
    },
    p => (patches = p),
  )

  const res = diff(patches)(state)

  t.deepEqual(res, [{ d: [['bar', 'baz']] }, { d: { length: [2, 1] } }])
  t.true(isDiff(res[0].d[0]))
  t.true(isDiff(res[1].d.length))
})

test('real immer patch :: change value of string property', t => {
  let patches

  produce(
    state,
    draft => {
      draft.c = 'quux'
    },
    p => (patches = p),
  )

  const res = diff(patches)(state)

  t.deepEqual(res, [{ c: ['foo', 'quux'] }])
  t.true(isDiff(res[0].c))
  t.is(res[0].c.length, 2)
})

test('real immer patch :: remove element from array property and change value of string property', t => {
  let patches

  produce(
    state,
    draft => {
      draft.c = 'quux'
      draft.d.splice(1, 1)
    },
    p => (patches = p),
  )

  const res = diff(patches)(state)
  t.deepEqual(res, [{ d: { length: [2, 1] } }, { c: ['foo', 'quux'] }])

  t.true(isDiff(res[1].c))
  t.true(isDiff(res[0].d.length))
})

test('real immer patch :: change element in array property', t => {
  let patches

  produce(
    state,
    draft => {
      draft.e[1].f = 5
    },
    p => (patches = p),
  )

  const res = diff(patches)(state)

  t.deepEqual(res, [{ e: [, { f: [4, 5] }] }])
  t.false(isDiff(res[0].e))
  t.true(isDiff(res[0].e[1].f))
})

test('real immer patch :: delete key from object element in array property', t => {
  let patches

  produce(
    state,
    draft => {
      delete draft.e[1].f
    },
    p => (patches = p),
  )

  const res = diff(patches)(state)

  t.deepEqual(res, [{ e: [, { f: [4, 0, 0] }] }])
  t.true(isDiff(res[0].e[1].f))
})

test('real immer patch :: delete element from array element in array property', t => {
  let patches

  const next = produce(
    state,
    draft => {
      draft.g[1].splice(1, 2)
    },
    p => (patches = p),
  )

  const res = diff(patches)(state)

  t.deepEqual(res, [{ g: [, [, [8, 10]]] }, { g: [, { length: [4, 2] }] }])
  t.false(isDiff(res[0].g[1]))
  t.true(isDiff(res[0].g[1][1]))
  t.false(isDiff(res[1].g[1]))
  t.true(isDiff(res[1].g[1].length))
})
