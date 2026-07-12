/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Palette "santé publique" : teal profond (confiance, soin) + ambre (alerte douce)
        clinic: {
          50: "#F0FAF8",
          100: "#D7F0EA",
          200: "#A8E0D3",
          500: "#0F766E",
          600: "#0C5F58",
          700: "#0A4A45",
          900: "#062E2A",
        },
        alertweb: {
          100: "#FEF3C7",
          500: "#D97706",
          700: "#92400E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        }
      },
      animation: {
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
