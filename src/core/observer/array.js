/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
// 复制数组的原型
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
// export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
//   Object.defineProperty(obj, key, {
//     value: val,
//     enumerable: !!enumerable,
//     writable: true,
//     configurable: true
//   })
// }
/**
 * Intercept mutating methods and emit events
 */
// 覆盖方法
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    // 数组方法的默认行为
    const result = original.apply(this, args)

    // 获取数组的observer对象，主要为了获取ob.dep，用于通知更新
    const ob = this.__ob__
    // 插入操作：会导致新元素进入，需要做响应式处理
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        // []splice(index, delLength, insertItem, insertItem) 获取除前两个外的参数
        inserted = args.slice(2)
        break
    }
    console.log('inserted====', inserted)
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 通知更新
    ob.dep.notify()
    return result
  })
})
