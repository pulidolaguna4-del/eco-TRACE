import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    const temaGuardado = localStorage.getItem('tema')
    if (temaGuardado) {
      return temaGuardado
    }
    const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefiereOscuro ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (tema === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('tema', tema)
  }, [tema])

  const alternarTema = () => {
    setTema((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider')
  }
  return context
}
