'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut, Settings, Heart } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import AuthModal from '@/components/auth/AuthModal'

interface NavigationProps {
  className?: string
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()

  const navigationItems = [
    { name: 'Home', href: '/', active: pathname === '/' },
    { name: 'Try-On', href: '/try-on', active: pathname === '/try-on' },
    { name: 'Saved Looks', href: '/saved-looks', active: pathname === '/saved-looks' },
    { name: 'Find Salons', href: '/salons', active: pathname === '/salons' },
  ]

  const userMenuItems = [
    { name: 'My Profile', href: '/profile', icon: User },
    { name: 'Saved Looks', href: '/saved-looks', icon: Heart },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Sign Out', href: '/logout', icon: LogOut },
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  return (
    <nav className={`bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/NailXR-symbol.png" 
              alt="NailXR" 
              className="h-8 w-8 transition-transform group-hover:scale-110"
            />
            <span className="text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
              NailXR
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-pink-50 text-pink-600 border border-pink-200'
                    : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* Welcome message */}
                <span className="text-sm text-gray-600">
                  Hi, {user.user_metadata?.name || user.email?.split('@')[0]}
                </span>
                
                {/* User Avatar (when logged in) */}
                <div className="relative">
                  <button
                    onClick={toggleUserMenu}
                    className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center hover:bg-pink-200 transition-colors"
                  >
                    <User className="h-4 w-4 text-pink-600" />
                  </button>
                  
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                      >
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          My Profile
                        </Link>
                        <Link
                          href="/saved-looks"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Heart className="h-4 w-4" />
                          Saved Looks
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            signOut()
                            setIsUserMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                disabled={loading}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Sign In'}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    item.active
                      ? 'bg-pink-50 text-pink-600 border border-pink-200'
                      : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile User Actions */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-600">
                      Hi, {user.user_metadata?.name || user.email?.split('@')[0]}
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                    <Link
                      href="/saved-looks"
                      className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Heart className="h-4 w-4" />
                      Saved Looks
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        signOut()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setIsAuthModalOpen(true)
                      setIsMobileMenuOpen(false)
                    }}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Sign In'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </nav>
  )
}

export default Navigation
