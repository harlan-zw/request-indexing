import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'Open Sans fallback', 'sans-serif'],
        title: ['Poppins', 'Poppins fallback', 'sans-serif'],
      },
    },
  },
}
