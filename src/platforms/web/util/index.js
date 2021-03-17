/* @flow */

import { warn } from 'core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

/**
 * Query an element selector if it's not an element already.
 */
// 参数 为string 或者 元素类型
export function query (el: string | Element): Element {
  // 如果是字符串
  if (typeof el === 'string') {
    // 获取元素
    const selected = document.querySelector(el)
    // 如果获取不到，报警告，并且创建一个div元素 并返回
    if (!selected) {
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
      return document.createElement('div')
    }
    return selected
  } else {
    // 直接返回 元素
    return el
  }
}
