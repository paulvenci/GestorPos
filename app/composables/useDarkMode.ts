export const useDarkMode = () => {
  const isDark = useState('isDark', () => false)

  const toggleDark = () => {
    isDark.value = !isDark.value
    actualizarClase()
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  const actualizarClase = () => {
    if (process.client) {
      if (isDark.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const initDark = () => {
    if (process.client) {
      const saved = localStorage.getItem('theme')
      if (saved) {
        isDark.value = saved === 'dark'
      } else {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      actualizarClase()
    }
  }

  return { isDark, toggleDark, initDark }
}
