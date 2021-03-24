import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// Vue构造函数
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 初始化方法
  this._init(options)
}

// 初始化实例方法和静态成员
initMixin(Vue) // _init()
stateMixin(Vue) // $set/$delete/$watch
eventsMixin(Vue) // $on/$off/$once/$emit
lifecycleMixin(Vue) // $forceUpdate/_update()/$destroy
renderMixin(Vue) // $nextTick /_render
export default Vue
