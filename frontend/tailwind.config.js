/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                teal: '#0d9488',
                coral: '#fb7185',
                golden: '#facc15',
                dark: '#1f2937',
                medium: '#6b7280',
                light: '#f9fafb',
            }
        },
    },
    plugins: [],
}
