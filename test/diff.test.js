import test from 'ava'
import { produce, enablePatches } from 'immer'
import { diff, isDiff } from '../src'

enablePatches()

test('add', t => {
  const res = diff([
    {
      op: 'add',
      path: ['a', 'b'],
      value: 2,
    },
  ])({ a: {} })

  t.deepEqual(res, { a: { b: [2] } })
  t.true(isDiff(res.a.b))
  t.is(res.a.b.length, 1)
})

test('add in array', t => {
  const res = diff([
    {
      op: 'add',
      path: [0, 0],
      value: 'a',
    },
  ])([])

  t.deepEqual(res, [[['a']]])
  t.true(isDiff(res[0][0]))
})

test('replace in array', t => {
  const res = diff([
    {
      op: 'replace',
      path: [0, 1],
      value: 'c',
    },
  ])([['a', 'b']])

  t.deepEqual(res, [[, ['b', 'c']]])
  t.true(isDiff(res[0][1]))
})

test('sparse add in array', t => {
  const res = diff([
    {
      op: 'add',
      path: [1, 0],
      value: 'a',
    },
  ])([])

  t.deepEqual(res, [, [['a']]])
  t.true(isDiff(res[1][0]))
})

test('remove', t => {
  const res = diff([
    {
      op: 'remove',
      path: ['a', 'b'],
    },
  ])({ a: { b: { c: 2 } } })

  t.deepEqual(res, { a: { b: [{ c: 2 }, 0, 0] } })
  t.true(isDiff(res.a.b))
  t.is(res.a.b.length, 3)
})

test('replace', t => {
  const res = diff([
    {
      op: 'replace',
      path: ['a', 'b'],
      value: 3,
    },
  ])({ a: { b: { c: 2 } } })

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

  t.deepEqual(res, { a: { b: [{ c: 2 }, 3], foo: [{ bar: 3 }] } })

  t.true(isDiff(res.a.b))
  t.is(res.a.b.length, 2)

  t.true(isDiff(res.a.foo))
  t.is(res.a.foo.length, 1)
})

test('replace root', t => {
  const res = diff([
    {
      op: 'replace',
      path: [],
      value: { a: { b: 2 } },
    },
  ])({})

  t.deepEqual(res, [{}, { a: { b: 2 } }])
  t.true(isDiff(res))
  t.is(res.length, 2)
})

test('no valid patch list', t => {
  const res1 = diff()({})
  const res2 = diff([])({})
  const res3 = diff(2)({})

  t.is(res1, undefined)
  t.is(res2, undefined)
  t.is(res3, undefined)
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
    [7, 8],
  ],
}

test('real immer patch :: remove element from array property', t => {
  let patches

  produce(
    state,
    draft => {
      draft.d.splice(1, 1)
    },
    p => (patches = p),
  )

  const res = diff(patches)(state)

  t.deepEqual(res, { d: [, ['baz', 0, 0]] })
  t.true(isDiff(res.d[1]))
  t.is(res.d[1].length, 3)
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

  t.deepEqual(res, { c: ['foo', 'quux'] })
  t.true(isDiff(res.c))
  t.is(res.c.length, 2)
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

  t.deepEqual(res, { c: ['foo', 'quux'], d: [, ['baz', 0, 0]] })

  t.true(isDiff(res.c))
  t.is(res.c.length, 2)

  t.true(isDiff(res.d[1]))
  t.is(res.d[1].length, 3)
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

  t.deepEqual(res, { e: [, { f: [4, 5] }] })
  t.false(isDiff(res.e))
  t.true(isDiff(res.e[1].f))
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

  t.deepEqual(res, { e: [, { f: [4, 0, 0] }] })
  t.true(isDiff(res.e[1].f))
})

test('real immer patch :: delete element from array element in array property', t => {
  let patches

  produce(
    state,
    draft => {
      draft.g[1].splice(1, 1)
    },
    p => (patches = p),
  )

  const res = diff(patches)(state)

  t.deepEqual(res, { g: [, [, [8, 0, 0]]] })
  t.false(isDiff(res.g[1]))
  t.true(isDiff(res.g[1][1]))
})
