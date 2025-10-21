'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { TenantConfig, getCurrentTenant } from '@/lib/tenant'

interface ThemeContextType {
  tenant: TenantConfig
  updateTenant: (tenant: TenantConfig) => void
  isDemoMode: boolean
  setDemoMode: (demo: boolean, demoConfig?: TenantConfig) => void
  demoTenant?: TenantConfig
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  initialTenant?: TenantConfig
}

export function ThemeProvider({ children, initialTenant }: ThemeProviderProps) {
  const [tenant, setTenant] = useState<TenantConfig>(initialTenant || getCurrentTenant())
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoTenant, setDemoTenant] = useState<TenantConfig>()

  const updateTenant = (newTenant: TenantConfig) => {
    setTenant(newTenant)
    applyTheme(newTenant)
  }

  const setDemoMode = (demo: boolean, demoConfig?: TenantConfig) => {
    setIsDemoMode(demo)
    if (demo && demoConfig) {
      setDemoTenant(demoConfig)
      applyTheme(demoConfig)
    } else {
      setDemoTenant(undefined)
      applyTheme(tenant)
    }
  }

  const applyTheme = (config: TenantConfig) => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    
    // Apply CSS custom properties for dynamic theming
    root.style.setProperty('--primary-color', config.branding.primaryColor)
    root.style.setProperty('--secondary-color', config.branding.secondaryColor)
    root.style.setProperty('--accent-color', config.branding.accentColor)
    
    // Apply font family if specified
    if (config.branding.fontFamily) {
      root.style.setProperty('--font-family', config.branding.fontFamily)
    }

    // Update document title
    document.title = `${config.content.companyName} - ${config.content.tagline}`

    // Update meta tags
    updateMetaTags(config)
  }

  const updateMetaTags = (config: TenantConfig) => {
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = name
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    const updateProperty = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', property)
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    updateMeta('description', config.content.heroSubtitle)
    updateMeta('keywords', `nail art, virtual try-on, ${config.content.companyName}, nail design`)
    
    updateProperty('og:title', `${config.content.companyName} - ${config.content.tagline}`)
    updateProperty('og:description', config.content.heroSubtitle)
    updateProperty('og:site_name', config.content.companyName)
  }

  useEffect(() => {
    applyTheme(isDemoMode && demoTenant ? demoTenant : tenant)
  }, [tenant, isDemoMode, demoTenant])

  return (
    <ThemeContext.Provider 
      value={{ 
        tenant: isDemoMode && demoTenant ? demoTenant : tenant, 
        updateTenant, 
        isDemoMode, 
        setDemoMode: setDemoMode,
        demoTenant 
      }}
    >
      <div className="theme-root" style={{
        '--primary': (isDemoMode && demoTenant ? demoTenant : tenant).branding.primaryColor,
        '--secondary': (isDemoMode && demoTenant ? demoTenant : tenant).branding.secondaryColor,
        '--accent': (isDemoMode && demoTenant ? demoTenant : tenant).branding.accentColor,
      } as React.CSSProperties}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

// Dynamic CSS injection for tenant-specific styles
export function TenantStyles() {
  const { tenant } = useTheme()

  useEffect(() => {
    const styleId = 'tenant-dynamic-styles'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    const css = `
      :root {
        --tenant-primary: ${tenant.branding.primaryColor};
        --tenant-secondary: ${tenant.branding.secondaryColor};
        --tenant-accent: ${tenant.branding.accentColor};
        --tenant-font: ${tenant.branding.fontFamily || 'system-ui'};
      }

      .bg-primary {
        background-color: var(--tenant-primary) !important;
      }

      .bg-secondary {
        background-color: var(--tenant-secondary) !important;
      }

      .text-primary {
        color: var(--tenant-primary) !important;
      }

      .text-secondary {
        color: var(--tenant-secondary) !important;
      }

      .border-primary {
        border-color: var(--tenant-primary) !important;
      }

      .bg-gradient-primary {
        background: linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary)) !important;
      }

      .hover\\:bg-primary:hover {
        background-color: var(--tenant-primary) !important;
      }

      .focus\\:ring-primary:focus {
        --tw-ring-color: var(--tenant-primary) !important;
      }

      .bg-gradient-to-r.from-pink-500.to-purple-600 {
        background: linear-gradient(to right, var(--tenant-primary), var(--tenant-secondary)) !important;
      }

      .text-pink-600 {
        color: var(--tenant-primary) !important;
      }

      .text-purple-600 {
        color: var(--tenant-secondary) !important;
      }

      .border-pink-500 {
        border-color: var(--tenant-primary) !important;
      }

      .bg-pink-50 {
        background-color: color-mix(in srgb, var(--tenant-primary) 10%, white) !important;
      }

      .bg-pink-100 {
        background-color: color-mix(in srgb, var(--tenant-primary) 20%, white) !important;
      }

      .hover\\:border-pink-300:hover {
        border-color: color-mix(in srgb, var(--tenant-primary) 40%, white) !important;
      }

      .hover\\:text-pink-600:hover {
        color: var(--tenant-primary) !important;
      }

      .text-pink-700 {
        color: color-mix(in srgb, var(--tenant-primary) 80%, black) !important;
      }

      body {
        font-family: var(--tenant-font), system-ui, sans-serif;
      }
    `

    styleElement.textContent = css
  }, [tenant])

  return null
}

// Hook for tenant-aware styling
export function useTenantStyle() {
  const { tenant } = useTheme()

  const getStyle = (type: 'primary' | 'secondary' | 'accent' | 'gradient') => {
    switch (type) {
      case 'primary':
        return { backgroundColor: tenant.branding.primaryColor }
      case 'secondary':
        return { backgroundColor: tenant.branding.secondaryColor }
      case 'accent':
        return { backgroundColor: tenant.branding.accentColor }
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${tenant.branding.primaryColor}, ${tenant.branding.secondaryColor})`
        }
      default:
        return {}
    }
  }

  const getClassName = (type: 'primary' | 'secondary' | 'accent') => {
    // Return utility classes that will be styled by our dynamic CSS
    switch (type) {
      case 'primary':
        return 'bg-primary text-white'
      case 'secondary':
        return 'bg-secondary text-white'
      case 'accent':
        return 'bg-accent text-gray-900'
      default:
        return ''
    }
  }

  return { getStyle, getClassName, tenant }
}
