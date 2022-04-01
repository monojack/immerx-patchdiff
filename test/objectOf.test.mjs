import test from 'ava'

import { objectOf } from '../src/objectOf.mjs'

test('builds nested objects', t => {
  const res = objectOf(['foo', 'bar', 'baz'])(2)

  t.deepEqual(res, { foo: { bar: { baz: 2 } } })
})

test('builds nested arrays', t => {
  const res = objectOf([0, 0, 0])(2)

  t.deepEqual(res, [[[2]]])
})

test('builds nested arrays and objects', t => {
  const res1 = objectOf([0, 'foo', 0])(2)
  const res2 = objectOf([0, 'foo', 0, 'bar'])(2)
  const res3 = objectOf(['foo', 0, 'bar'])(2)
  const res4 = objectOf(['foo', 0, 'bar', 0])(2)

  t.deepEqual(res1, [{ foo: [2] }])
  t.deepEqual(res2, [{ foo: [{ bar: 2 }] }])
  t.deepEqual(res3, { foo: [{ bar: 2 }] })
  t.deepEqual(res4, { foo: [{ bar: [2] }] })
})

test('builds sparse arrays', t => {
  const res = objectOf([0, 1, 0, 2])(2)

  t.deepEqual(res, [[, [[, , 2]]]])
})

test('builds nested sparse/arrays and objects', t => {
  const res1 = objectOf([1, 'foo', 0, 'bar'])(2)
  const res2 = objectOf(['foo', 2, 'bar', 0])(2)

  t.deepEqual(res1, [, { foo: [{ bar: 2 }] }])
  t.deepEqual(res2, { foo: [, , { bar: [2] }] })
})
