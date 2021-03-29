/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

// 扩展$mount：判断是否需要编译出渲染函数
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  // 宿主元素
  // query(el) 如果el是选择器，则通过选择器 获取元素，如果获取不到，报警告 然后创建一个div元素并返回
  // 如果 el是元素则直接返回 el元素
  el = el && query(el)

  // 如果el 是body 或者 html 报警告
  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  // 处理选项：render/template/el
  const options = this.$options
  // resolve template/el and convert to render function
  // render不存在才判断template
  // 先判断render > 在判断template > 最后判断el
  if (!options.render) {
    // render不存在，获取template模板
    let template = options.template
    if (template) {
      // 3个嵌套判断
      // 模板是字符串
      // 模板有nodeType
      // 其他

      // 如果模板是字符串
      if (typeof template === 'string') {
        // 如果模板是 x-template方式
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 模板template 且 el 存在
      // 获取el的 outerHTML属性，即el元素的序列化HTML片段
      template = getOuterHTML(el)
    }
    // 如果模板存在
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      // 运行时编译：将模板编译为render函数
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      // 设置选项的 this.$option.render 和 .staticRenderFns
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  // 
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions
// 1 扩展了 Vue.prototype.$mount的方法
// 2 定义了Vue.compile静态方法
export default Vue

// x-template模板方式
// Vue.component('my-checkbox', { 
//   template: '#checkbox-template', 
//     data() { 
//       return { 
//         checked: false, title: 'Check me' 
//       } 
//     },
//   }
// } 
// <script type="text/x-template" id="checkbox-template"> 
//   <div class="checkbox-wrapper" @click="check"> 
//     <div :class="{ checkbox: true, checked: checked }"></div> 
//     <div class="title"></div> 
//     </div> 
// </script>

