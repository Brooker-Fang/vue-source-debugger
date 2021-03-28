/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

// 传入Vue
export function initMixin (Vue: Class<Component>) {
  // 实现 Vue.prototype._init方法，传入配置参数
  // 1 合并配置
  // 2 设置vm.renderProxy 
  // 3 设置vm._self属性
  // 4 initLifecycle( 初始化组件的 $parent\$root\$children\$ref,
  //                  _watcher\_inactive\_directInactive\_isMounted\_isDestroyed\_isBeingDestroyed)
  // 5 initEvents (初始化组件的_events,_hasHookEvent 派发给父组件的自定义事件)
  // 6 initRender (初始化组件的_vnode, _staticTrees, $slots, $scopedSlots,
  //              生成vm._c 用于编译器使用的渲染函数，vm.$createElement用户传入的render渲染函数，
  //              对组件的$listeners、$attrs做响应式处理)
  // 7 执行beforeCreate生命周期函数
  // 8 initInjections 获取组件的inject所有属性，并做响应式处理
  // 9 initState 组件数据的初始化 
  //    a、初始化组件props，做校验和响应式处理
  //    b、初始化组件的methods，校验是否在props已存在
  //    c、对组件的data 做响应式处理，并代理到组件上
  //    d、初始化组件的computed 
  //    f、初始化组件的watch
  // 10 initProvide 获取组件的provide所有属性，并做响应式处理
  // 11 执行created 生命周期函数
  // 12 执行$mount方法，
  //    a、重新获取el 宿主元素，
  //    b、然后执行mountComponent方法($mount 定义于platforms/web/runtime/index.js)
  // 13 执行mountComponent(定义core/instance/lifecycle)
  //    a、执行beforeMount生命周期
  //    b、定义updateComponent函数 = vm._update(vm._render(), hydrating)，用于watcher的更新。
  //          (Vue.prototype._update函数在./lifecycle.js的lifecycleMixin方法定义，Vue.prototype._render在./render.js 的renderMixin方法定义，
  //           _render返回虚拟dom，_update将虚拟dom 渲染更新)
  // 14 new watcher，传入当前组件 和  updateComponent函数作为watcher更新函数，同时执行更新函数，将虚拟dom 更新挂载到真实dom上
  // 15 挂载过后vm._isMounted 设置为 true，
  // 16 执行mounted生命周期函数
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++
    debugger
    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }
    // a flag to avoid this being observed
    // 标记组件的数据已经进行过响应式处理了
    vm._isVue = true
    // merge options
    // 合并选项
    // 如果是组件
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      // mergeOptions 格式化了 props、inject、directive
      // ...TODO
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    // 如果不是生产环境 
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    // 初始化核心
    vm._self = vm
    initLifecycle(vm) // $parent $root $children
    initEvents(vm) // 事件监听
    initRender(vm) // $slots/$createElement/vm._c
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm) // 核心：数据初始化
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el) // $mount 在src\platforms\web\entry-runtime-with-compiler.js文件中执行了扩展
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
