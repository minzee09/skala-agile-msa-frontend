import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

/**
 * Vuetify는 구조 컴포넌트(다이얼로그·입력·스위치·탭)만 쓰고,
 * 룩앤필은 tokens.css / base.css 가 덮어쓴다. 아이콘 폰트는 쓰지 않는다(인라인 SVG).
 */
export default createVuetify({
  components,
  directives,
  defaults: {
    VBtn: { variant: 'flat', rounded: 0, height: 36 },
    VTextField: { variant: 'underlined', density: 'comfortable', hideDetails: 'auto' },
    VSelect: { variant: 'underlined', density: 'comfortable', hideDetails: 'auto' },
    VTextarea: { variant: 'underlined', hideDetails: 'auto' },
    VCheckbox: { color: 'ink', density: 'compact', hideDetails: true },
    VSwitch: { color: 'ink', inset: true, density: 'compact', hideDetails: true },
    VChip: { variant: 'outlined', size: 'small', label: true },
    VDialog: { maxWidth: 520 },
  },
  theme: {
    defaultTheme: 'sk',
    themes: {
      sk: {
        dark: false,
        colors: {
          background: '#fafaf8',
          surface: '#ffffff',
          primary: '#ea002c',
          secondary: '#009a93',
          warning: '#f47725',
          error: '#ea002c',
          ink: '#141414',
          'on-primary': '#ffffff',
          'on-surface': '#141414',
        },
      },
    },
  },
})
