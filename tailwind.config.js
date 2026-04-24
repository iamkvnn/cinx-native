/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7958ee", // Indigo 600
          light: "#818CF8", // Indigo 400
          dark: "#3730A3", // Indigo 800
        },
        secondary: {
          DEFAULT: "#F97316", // Orange 500
          light: "#FDBA74", // Orange 300
        },
        success: "#10B981", // Emerald 500
        error: "#EF4444", // Red 500
        warning: "#F59E0B", // Amber 500
        info: "#3B82F6", // Blue 500

        background: "#F3F4F6", // Gray 100 (Nền ứng dụng)
        surface: "#FFFFFF", // Trắng (Nền Card)
        dark: "#1F2937", // Text chính
        muted: "#6B7280", // Text phụ
      },
      fontFamily: {
        sans: ["System", "sans-serif"],
        bold: ["System", "sans-serif"],
      },
      backgroundColor: {
        glass: "rgba(255, 255, 255, 0.7)",
        "glass-dark": "rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
