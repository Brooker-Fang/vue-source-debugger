/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  // ASSET_TYPES = ['component','directive','filter'] 
  // 
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        // Vue.component('comp', {...options})
        // 实际上是调用Vue.extend(options)
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          // 此时definition 即组件构造函数，可以通过new 实例化
          definition = this.options._base.extend(definition)
        }
        // Vue.directive('dir', {})
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        // 放入全局配置里，组件在初始化时，会合并配置，即每个组件实例化都能在options里获取到这个配置
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
