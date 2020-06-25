import { E2E_TIMEOUT, setupPuppeteer } from './e2eUtils'
import path from 'path'
import { mockWarn } from '@vue/shared'
import { h, createApp, Transition } from 'vue'

describe('e2e: Transition', () => {
  mockWarn()
  const { page, html, classList, isVisible } = setupPuppeteer()
  const baseUrl = `file://${path.resolve(__dirname, './transition.html')}`

  const duration = 50
  const buffer = 5

  const classWhenTransitionStart = () =>
    page().evaluate(() => {
      (document.querySelector('#toggleBtn') as any)!.click()
      return Promise.resolve().then(() => {
        return document.querySelector('#container div')!.className.split(/\s+/g)
      })
    })

  const transitionFinish = (time = duration) =>
    new Promise(r => {
      setTimeout(r, time + buffer)
    })

  const nextFrame = () => {
    return page().evaluate(() => {
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve)
        })
      })
    })
  }

  beforeEach(async () => {
    await page().goto(baseUrl)
    await page().waitFor('#app')
  })

  describe('transition with v-if', () => {
    test(
      'basic transition',
      async () => {
        await page().evaluate(() => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
            <div id="container">
              <transition>
                <div v-if="toggle" class="test">content</div>
              </transition>
            </div>
            <button id="toggleBtn" @click="click">button</button>
          `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'v-leave-active',
          'v-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'v-leave-active',
          'v-leave-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'v-enter-active',
          'v-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'v-enter-active',
          'v-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'named transition',
      async () => {
        await page().evaluate(() => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <div id="container">
                <transition name="test">
                  <div v-if="toggle" class="test">content</div>
                </transition>
              </div>
              <button id="toggleBtn" @click="click">button</button>
            `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'custom transition classes',
      async () => {
        await page().evaluate(() => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
          <div id="container">
            <transition enter-from-class="hello-from"
              enter-active-class="hello-active"
              enter-to-class="hello-to"
              leave-from-class="bye-from"
              leave-active-class="bye-active"
              leave-to-class="bye-to">
              <div v-if="toggle" class="test">content</div>
            </transition>
          </div>
          <button id="toggleBtn" @click="click">button</button>
          `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'bye-active',
          'bye-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'bye-active',
          'bye-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'hello-active',
          'hello-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'hello-active',
          'hello-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'transition with dynamic name',
      async () => {
        await page().evaluate(() => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
          <div id="container">
            <transition :name="name">
              <div v-if="toggle" class="test">content</div>
            </transition>
          </div>
          <button id="toggleBtn" @click="click">button</button>
          <button id="changeNameBtn" @click="changeName">button</button>
          `,
            setup: () => {
              const name = ref('test')
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              const changeName = () => (name.value = 'changed')
              return { toggle, click, name, changeName }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        await page().evaluate(() => {
          ;(document.querySelector('#changeNameBtn') as any).click()
        })
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'changed-enter-active',
          'changed-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'changed-enter-active',
          'changed-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'transition events without appear',
      async () => {
        const beforeLeaveSpy = jest.fn()
        const onLeaveSpy = jest.fn()
        const afterLeaveSpy = jest.fn()
        const beforeEnterSpy = jest.fn()
        const onEnterSpy = jest.fn()
        const afterEnterSpy = jest.fn()

        await page().exposeFunction('onLeaveSpy', onLeaveSpy)
        await page().exposeFunction('onEnterSpy', onEnterSpy)
        await page().exposeFunction('beforeLeaveSpy', beforeLeaveSpy)
        await page().exposeFunction('beforeEnterSpy', beforeEnterSpy)
        await page().exposeFunction('afterLeaveSpy', afterLeaveSpy)
        await page().exposeFunction('afterEnterSpy', afterEnterSpy)

        await page().evaluate(() => {
          const {
            beforeEnterSpy,
            onEnterSpy,
            afterEnterSpy,
            beforeLeaveSpy,
            onLeaveSpy,
            afterLeaveSpy
          } = window as any
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
            <div id="container">
              <transition
                name="test"
                @before-enter="beforeEnterSpy"
                @enter="onEnterSpy"
                @after-enter="afterEnterSpy"
                @before-leave="beforeLeaveSpy"
                @leave="onLeaveSpy"
                @after-leave="afterLeaveSpy">
                <div v-if="toggle" class="test">content</div>
              </transition>
            </div>
            <button id="toggleBtn" @click="click">button</button>
          `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return {
                toggle,
                click,
                beforeEnterSpy,
                onEnterSpy,
                afterEnterSpy,
                beforeLeaveSpy,
                onLeaveSpy,
                afterLeaveSpy
              }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        // todo test event with arguments. Note: not get dom, get object. '{}'
        expect(beforeLeaveSpy).toBeCalled()
        expect(onLeaveSpy).not.toBeCalled()
        expect(afterLeaveSpy).not.toBeCalled()
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        expect(beforeLeaveSpy).toBeCalled()
        expect(afterLeaveSpy).not.toBeCalled()
        await transitionFinish()
        expect(await html('#container')).toBe('<!--v-if-->')
        expect(afterLeaveSpy).toBeCalled()

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        expect(beforeEnterSpy).toBeCalled()
        expect(onEnterSpy).not.toBeCalled()
        expect(afterEnterSpy).not.toBeCalled()
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        expect(onEnterSpy).toBeCalled()
        expect(afterEnterSpy).not.toBeCalled()
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')
        expect(afterEnterSpy).toBeCalled()
      },
      E2E_TIMEOUT
    )

    test('onEnterCancelled', async () => {
      const enterCancelledSpy = jest.fn()

      await page().exposeFunction('enterCancelledSpy', enterCancelledSpy)

      await page().evaluate(() => {
        const { enterCancelledSpy } = window as any
        const { createApp, ref } = (window as any).Vue
        createApp({
          template: `
            <div id="container">
              <transition
                name="test"
                @enter-cancelled="enterCancelledSpy">
                <div v-if="toggle" class="test">content</div>
              </transition>
            </div>
            <button id="toggleBtn" @click="click">button</button>
          `,
          setup: () => {
            const toggle = ref(false)
            const click = () => (toggle.value = !toggle.value)
            return {
              toggle,
              click,
              enterCancelledSpy
            }
          }
        }).mount('#app')
      })
      expect(await html('#container')).toBe('<!--v-if-->')

      // enter
      expect(await classWhenTransitionStart()).toStrictEqual([
        'test',
        'test-enter-active',
        'test-enter-from'
      ])
      await nextFrame()
      expect(await classList('.test')).toStrictEqual([
        'test',
        'test-enter-active',
        'test-enter-to'
      ])

      // cancel (leave)
      expect(await classWhenTransitionStart()).toStrictEqual([
        'test',
        'test-leave-active',
        'test-leave-from'
      ])
      // fixme
      expect(enterCancelledSpy).not.toBeCalled()
      await nextFrame()
      expect(await classList('.test')).toStrictEqual([
        'test',
        'test-leave-active',
        'test-leave-to'
      ])
      await transitionFinish()
      expect(await html('#container')).toBe('<!--v-if-->')
    })

    test(
      'transition on appear',
      async () => {
        await page().evaluate(async () => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <div id="container">
                <transition name="test"
                            appear
                            appear-from-class="test-appear-from"
                            appear-to-class="test-appear-to"
                            appear-active-class="test-appear-active">
                  <div v-if="toggle" class="test">content</div>
                </transition>
              </div>
              <button id="toggleBtn" @click="click">button</button>
            `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        })
        // appear
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-appear-active',
          'test-appear-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-appear-active',
          'test-appear-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'transition events with appear',
      async () => {
        const onLeaveSpy = jest.fn()
        const onEnterSpy = jest.fn()
        const onAppearSpy = jest.fn()
        const beforeLeaveSpy = jest.fn()
        const beforeEnterSpy = jest.fn()
        const beforeAppearSpy = jest.fn()
        const afterLeaveSpy = jest.fn()
        const afterEnterSpy = jest.fn()
        const afterAppearSpy = jest.fn()

        await page().exposeFunction('onLeaveSpy', onLeaveSpy)
        await page().exposeFunction('onEnterSpy', onEnterSpy)
        await page().exposeFunction('onAppearSpy', onAppearSpy)
        await page().exposeFunction('beforeLeaveSpy', beforeLeaveSpy)
        await page().exposeFunction('beforeEnterSpy', beforeEnterSpy)
        await page().exposeFunction('beforeAppearSpy', beforeAppearSpy)
        await page().exposeFunction('afterLeaveSpy', afterLeaveSpy)
        await page().exposeFunction('afterEnterSpy', afterEnterSpy)
        await page().exposeFunction('afterAppearSpy', afterAppearSpy)

        const appearClass = await page().evaluate(async () => {
          const {
            beforeAppearSpy,
            onAppearSpy,
            afterAppearSpy,
            beforeEnterSpy,
            onEnterSpy,
            afterEnterSpy,
            beforeLeaveSpy,
            onLeaveSpy,
            afterLeaveSpy
          } = window as any
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <div id="container">
                <transition
                  name="test"
                  appear
                  appear-from-class="test-appear-from"
                  appear-to-class="test-appear-to"
                  appear-active-class="test-appear-active"
                  @before-enter="beforeEnterSpy"
                  @enter="onEnterSpy"
                  @after-enter="afterEnterSpy"
                  @before-leave="beforeLeaveSpy"
                  @leave="onLeaveSpy"
                  @after-leave="afterLeaveSpy"
                  @before-appear="beforeAppearSpy"
                  @appear="onAppearSpy"
                  @after-appear="afterAppearSpy">
                  <div v-if="toggle" class="test">content</div>
                </transition>
              </div>
              <button id="toggleBtn" @click="click">button</button>
            `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return {
                toggle,
                click,
                beforeAppearSpy,
                onAppearSpy,
                afterAppearSpy,
                beforeEnterSpy,
                onEnterSpy,
                afterEnterSpy,
                beforeLeaveSpy,
                onLeaveSpy,
                afterLeaveSpy
              }
            }
          }).mount('#app')
          return Promise.resolve().then(() => {
            return document.querySelector('.test')!.className.split(/\s+/g)
          })
        })
        // appear fixme spy called
        expect(appearClass).toStrictEqual([
          'test',
          'test-appear-active',
          'test-appear-from'
        ])
        expect(beforeAppearSpy).not.toBeCalled()
        expect(onAppearSpy).not.toBeCalled()
        expect(afterAppearSpy).not.toBeCalled()
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-appear-active',
          'test-appear-to'
        ])
        expect(onAppearSpy).not.toBeCalled()
        expect(afterAppearSpy).not.toBeCalled()
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')
        expect(afterAppearSpy).not.toBeCalled()

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        expect(beforeLeaveSpy).toBeCalled()
        expect(onLeaveSpy).not.toBeCalled()
        expect(afterLeaveSpy).not.toBeCalled()
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        expect(onLeaveSpy).toBeCalled()
        expect(afterLeaveSpy).not.toBeCalled()
        await transitionFinish()
        expect(await html('#container')).toBe('<!--v-if-->')
        expect(afterLeaveSpy).toBeCalled()

        // enter fixme spy called
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        expect(beforeEnterSpy).toBeCalled()
        expect(onEnterSpy).toBeCalled()
        expect(afterEnterSpy).toBeCalled()
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        expect(onEnterSpy).toBeCalled()
        expect(afterEnterSpy).toBeCalled()
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')
        expect(afterEnterSpy).toBeCalled()
      },
      E2E_TIMEOUT
    )

    // fixme
    test(
      'css: false',
      async () => {
        const onLeaveSpy = jest.fn()
        const onEnterSpy = jest.fn()

        await page().exposeFunction('onLeaveSpy', onLeaveSpy)
        await page().exposeFunction('onEnterSpy', onEnterSpy)

        await page().evaluate(() => {
          const { onLeaveSpy, onEnterSpy } = window as any
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
            <div id="container">
              <transition
                :css="false"
                name="test"
                @enter="onEnterSpy"
                @leave="onLeaveSpy">
                <div v-if="toggle" class="test">content</div>
              </transition>
            </div>
            <button id="toggleBtn" @click="click"></button>
          `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click, onLeaveSpy, onEnterSpy }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        await classWhenTransitionStart()
        expect(onLeaveSpy).toBeCalled()
        expect(await html('#container')).toBe(
          '<div class="test">content</div><!--v-if-->'
        )
        // enter
        await classWhenTransitionStart()
        expect(onEnterSpy).toBeCalled()
        expect(await html('#container')).toBe('<div class="test">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'no transition detected',
      async () => {
        await page().evaluate(() => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
            <div id="container">
              <transition name="noop">
                <div v-if="toggle">content</div>
              </transition>
            </div>
            <button id="toggleBtn" @click="click">button</button>
          `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div>content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'noop-leave-active',
          'noop-leave-from'
        ])
        await nextFrame()
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'noop-enter-active',
          'noop-enter-from'
        ])
        await nextFrame()
        expect(await html('#container')).toBe('<div class="">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'animations',
      async () => {
        await page().evaluate(() => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <div id="container">
                <transition name="test-anim">
                  <div v-if="toggle">content</div>
                </transition>
              </div>
              <button id="toggleBtn" @click="click">button</button>
            `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div>content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test-anim-leave-active',
          'test-anim-leave-from'
        ])
        await nextFrame()
        expect(await classList('#container div')).toStrictEqual([
          'test-anim-leave-active',
          'test-anim-leave-to'
        ])
        await transitionFinish(duration * 2)
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test-anim-enter-active',
          'test-anim-enter-from'
        ])
        await nextFrame()
        expect(await classList('#container div')).toStrictEqual([
          'test-anim-enter-active',
          'test-anim-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'explicit transition type',
      async () => {
        await page().evaluate(() => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <div id="container"><transition name="test-anim-long" type="animation"><div v-if="toggle">content</div></transition></div>
              <button id="toggleBtn" @click="click">button</button>
            `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div>content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test-anim-long-leave-active',
          'test-anim-long-leave-from'
        ])
        await nextFrame()
        expect(await classList('#container div')).toStrictEqual([
          'test-anim-long-leave-active',
          'test-anim-long-leave-to'
        ])
        await new Promise(r => {
          setTimeout(r, duration + 5)
        })
        expect(await classList('#container div')).toStrictEqual([
          'test-anim-long-leave-active',
          'test-anim-long-leave-to'
        ])
        await transitionFinish(duration * 2)
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test-anim-long-enter-active',
          'test-anim-long-enter-from'
        ])
        await nextFrame()
        expect(await classList('#container div')).toStrictEqual([
          'test-anim-long-enter-active',
          'test-anim-long-enter-to'
        ])
        await new Promise(r => {
          setTimeout(r, duration + 5)
        })
        expect(await classList('#container div')).toStrictEqual([
          'test-anim-long-enter-active',
          'test-anim-long-enter-to'
        ])
        await transitionFinish(duration * 2)
        expect(await html('#container')).toBe('<div class="">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'transition on SVG elements',
      async () => {
        await page().evaluate(() => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <svg id="container">
                <transition name="test">
                  <circle v-if="toggle" cx="0" cy="0" r="10" class="test"></circle>
                </transition>
              </svg>
              <button id="toggleBtn" @click="click">button</button>
            `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe(
          '<circle cx="0" cy="0" r="10" class="test"></circle>'
        )

        const svgTransitionStart = () =>
          page().evaluate(() => {
            document.querySelector('button')!.click()
            return Promise.resolve().then(() => {
              return document
                .querySelector('.test')!
                .getAttribute('class')!
                .split(/\s+/g)
            })
          })

        // leave
        expect(await svgTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await svgTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe(
          '<circle cx="0" cy="0" r="10" class="test"></circle>'
        )
      },
      E2E_TIMEOUT
    )

    test(
      'custom transition higher-order component',
      async () => {
        await page().evaluate(() => {
          const { createApp, ref, h, Transition } = (window as any).Vue
          createApp({
            template: `
              <div id="container"><my-transition><div v-if="toggle" class="test">content</div></my-transition></div>
              <button id="toggleBtn" @click="click">button</button>
            `,
            components: {
              'my-transition': (props: any, { slots }: any) => {
                return h(Transition, { name: 'test' }, slots)
              }
            },
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'transition on child components with empty root node',
      async () => {
        await page().evaluate(() => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <div id="container">
                <transition name="test">
                  <component class="test" :is="view"></component>
                </transition>
              </div>
              <button id="toggleBtn" @click="click">button</button>
              <button id="changeViewBtn" @click="change">button</button>
            `,
            components: {
              one: {
                template: '<div v-if="false">one</div>'
              },
              two: {
                template: '<div>two</div>'
              }
            },
            setup: () => {
              const toggle = ref(true)
              const view = ref('one')
              const click = () => (toggle.value = !toggle.value)
              const change = () =>
                (view.value = view.value === 'one' ? 'two' : 'one')
              return { toggle, click, change, view }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<!--v-if-->')

        // change view -> 'two'
        await page().evaluate(() => {
          (document.querySelector('#changeViewBtn') as any)!.click()
        })
        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">two</div>')

        // change view -> 'one'
        await page().evaluate(() => {
          (document.querySelector('#changeViewBtn') as any)!.click()
        })
        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<!--v-if-->')
      },
      E2E_TIMEOUT
    )
  })

  describe('transition with v-show', () => {
    test(
      'named transition with v-show',
      async () => {
        await page().evaluate(() => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
            <div id="container">
              <transition name="test">
                <div v-show="toggle" class="test">content</div>
              </transition>
            </div>
            <button id="toggleBtn" @click="click">button</button>
          `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div class="test">content</div>')
        expect(await isVisible('.test')).toBe(true)

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish()
        expect(await isVisible('.test')).toBe(false)

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe(
          '<div class="test" style="">content</div>'
        )
      },
      E2E_TIMEOUT
    )

    test(
      'transition events with v-show',
      async () => {
        const beforeLeaveSpy = jest.fn()
        const onLeaveSpy = jest.fn()
        const afterLeaveSpy = jest.fn()
        const beforeEnterSpy = jest.fn()
        const onEnterSpy = jest.fn()
        const afterEnterSpy = jest.fn()

        await page().exposeFunction('onLeaveSpy', onLeaveSpy)
        await page().exposeFunction('onEnterSpy', onEnterSpy)
        await page().exposeFunction('beforeLeaveSpy', beforeLeaveSpy)
        await page().exposeFunction('beforeEnterSpy', beforeEnterSpy)
        await page().exposeFunction('afterLeaveSpy', afterLeaveSpy)
        await page().exposeFunction('afterEnterSpy', afterEnterSpy)

        await page().evaluate(() => {
          const {
            beforeEnterSpy,
            onEnterSpy,
            afterEnterSpy,
            beforeLeaveSpy,
            onLeaveSpy,
            afterLeaveSpy
          } = window as any
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
            <div id="container">
              <transition
                name="test"
                @before-enter="beforeEnterSpy"
                @enter="onEnterSpy"
                @after-enter="afterEnterSpy"
                @before-leave="beforeLeaveSpy"
                @leave="onLeaveSpy"
                @after-leave="afterLeaveSpy">
                <div v-show="toggle" class="test">content</div>
              </transition>
            </div>
            <button id="toggleBtn" @click="click">button</button>
          `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return {
                toggle,
                click,
                beforeEnterSpy,
                onEnterSpy,
                afterEnterSpy,
                beforeLeaveSpy,
                onLeaveSpy,
                afterLeaveSpy
              }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        expect(beforeLeaveSpy).toBeCalled()
        expect(onLeaveSpy).not.toBeCalled()
        expect(afterLeaveSpy).not.toBeCalled()
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        expect(beforeLeaveSpy).toBeCalled()
        expect(afterLeaveSpy).not.toBeCalled()
        await transitionFinish()
        expect(await isVisible('.test')).toBe(false)
        expect(afterLeaveSpy).toBeCalled()

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        expect(beforeEnterSpy).toBeCalled()
        expect(onEnterSpy).not.toBeCalled()
        expect(afterEnterSpy).not.toBeCalled()
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        expect(onEnterSpy).toBeCalled()
        expect(afterEnterSpy).not.toBeCalled()
        await transitionFinish()
        expect(await html('#container')).toBe(
          '<div class="test" style="">content</div>'
        )
        expect(afterEnterSpy).toBeCalled()
      },
      E2E_TIMEOUT
    )

    test(
      'onLeaveCancelled (v-show only)',
      async () => {
        const onLeaveCancelledSpy = jest.fn()

        await page().exposeFunction('onLeaveCancelledSpy', onLeaveCancelledSpy)
        await page().evaluate(() => {
          const { onLeaveCancelledSpy } = window as any
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
            <div id="container">
              <transition name="test">
                <div v-show="toggle" class="test" @leave-cancelled="onLeaveCancelledSpy">content</div>
              </transition>
            </div>
            <button id="toggleBtn" @click="click">button</button>
          `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click, onLeaveCancelledSpy }
            }
          }).mount('#app')
        })
        expect(await html('#container')).toBe('<div class="test">content</div>')
        expect(await isVisible('.test')).toBe(true)

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])

        // cancel (enter)
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        // fixme
        expect(onLeaveCancelledSpy).not.toBeCalled()
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe(
          '<div class="test" style="">content</div>'
        )
      },
      E2E_TIMEOUT
    )

    test(
      'transition on appear with v-show',
      async () => {
        const appearClass = await page().evaluate(async () => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <div id="container">
                <transition name="test"
                            appear
                            appear-from-class="test-appear-from"
                            appear-to-class="test-appear-to"
                            appear-active-class="test-appear-active">
                  <div v-show="toggle" class="test">content</div>
                </transition>
              </div>
              <button id="toggleBtn" @click="click">button</button>
            `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
          return Promise.resolve().then(() => {
            return document.querySelector('.test')!.className.split(/\s+/g)
          })
        })
        // appear
        expect(appearClass).toStrictEqual([
          'test',
          'test-appear-active',
          'test-appear-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-appear-active',
          'test-appear-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish()
        expect(await isVisible('.test')).toBe(false)

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe(
          '<div class="test" style="">content</div>'
        )
      },
      E2E_TIMEOUT
    )
  })

  test(
    'warn when used on multiple elements',
    async () => {
      createApp({
        render() {
          return h(Transition, null, {
            default: () => [h('div'), h('div')]
          })
        }
      }).mount(document.createElement('div'))
      expect(
        '<transition> can only be used on a single element or component'
      ).toHaveBeenWarned()
    },
    E2E_TIMEOUT
  )

  describe('explicit durations', () => {
    test(
      'single value',
      async () => {
        await page().evaluate(duration => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <div id="container">
                <transition name="test" duration="${duration * 2}">
                  <div v-if="toggle" class="test">content</div>
                </transition>
              </div>
              <button id="toggleBtn" @click="click">button</button>
            `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        }, duration)
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish(duration * 2)
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish(duration * 2)
        expect(await html('#container')).toBe('<div class="test">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'enter with explicit durations',
      async () => {
        await page().evaluate(duration => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <div id="container">
                <transition name="test" :duration="{ enter: ${duration * 2} }">
                  <div v-if="toggle" class="test">content</div>
                </transition>
              </div>
              <button id="toggleBtn" @click="click">button</button>
            `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        }, duration)
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish(duration * 2)
        expect(await html('#container')).toBe('<div class="test">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'leave with explicit durations',
      async () => {
        await page().evaluate(duration => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <div id="container">
                <transition name="test" :duration="{ leave: ${duration * 2} }">
                  <div v-if="toggle" class="test">content</div>
                </transition>
              </div>
              <button id="toggleBtn" @click="click">button</button>
            `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        }, duration)
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish(duration * 2)
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish()
        expect(await html('#container')).toBe('<div class="test">content</div>')
      },
      E2E_TIMEOUT
    )

    test(
      'separate enter and leave',
      async () => {
        await page().evaluate(duration => {
          const { createApp, ref } = (window as any).Vue
          createApp({
            template: `
              <div id="container">
                <transition name="test" :duration="{
                  enter: ${duration * 4},
                  leave: ${duration * 2}
                }">
                  <div v-if="toggle" class="test">content</div>
                </transition>
              </div>
              <button id="toggleBtn" @click="click">button</button>
            `,
            setup: () => {
              const toggle = ref(true)
              const click = () => (toggle.value = !toggle.value)
              return { toggle, click }
            }
          }).mount('#app')
        }, duration)
        expect(await html('#container')).toBe('<div class="test">content</div>')

        // leave
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-leave-active',
          'test-leave-to'
        ])
        await transitionFinish(duration * 2)
        expect(await html('#container')).toBe('<!--v-if-->')

        // enter
        expect(await classWhenTransitionStart()).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-from'
        ])
        await nextFrame()
        expect(await classList('.test')).toStrictEqual([
          'test',
          'test-enter-active',
          'test-enter-to'
        ])
        await transitionFinish(200)
        expect(await html('#container')).toBe('<div class="test">content</div>')
      },
      E2E_TIMEOUT
    )

    // fixme
    test.todo('warn invalid durations')
  })
})