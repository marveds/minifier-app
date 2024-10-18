/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './index.html',       // Specify your HTML file
    './renderer.js',      // Specify your JS file (adjust based on your file structure)
    './src/**/*.html',    // Include any other HTML files in src folder
    './src/**/*.js',      // Include any JS files in src folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

