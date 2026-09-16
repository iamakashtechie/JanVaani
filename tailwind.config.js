/** @type {import('tailwindcss').Config} */
/* NOTE: Tailwind v4 ignores theme.extend here.
   Custom colors and tokens are defined in src/index.css via @theme.
   This file only controls content scanning paths. */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
}
