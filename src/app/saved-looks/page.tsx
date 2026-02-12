'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Heart, Trash2, Share2, Download, Eye, 
  Calendar, Plus, Search, Filter, Grid, List, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { getUserLooks, deleteLook, type SavedLook } from '@/lib/saved-looks'

// Dynamically import HandModel to avoid SSR issues
const HandModel = dynamic(() => import('@/components/3d/HandModel'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[200px] bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )
})

export default function SavedLooksPage() {
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [selectedLook, setSelectedLook] = useState<SavedLook | null>(null)

  useEffect(() => {
    loadLooks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadLooks = async () => {
    setIsLoading(true)
    try {
      const looks = await getUserLooks()
      setSavedLooks(looks)
    } catch (error) {
      console.error('Failed to load looks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get all unique tags (parsing from notes for now, or metadata if available)
  // Assuming tags might be stored in notes or we simulate them
  const allTags: string[] = [] 

  // Filter and sort looks
  const filteredLooks = savedLooks
    .filter(look => {
      const matchesSearch = look.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          look.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || false
      const matchesTag = !selectedTag // || look.tags.includes(selectedTag)
      return matchesSearch && matchesTag
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || Date.now()).getTime()
      const dateB = new Date(b.created_at || Date.now()).getTime()
      
      switch (sortBy) {
        case 'newest':
          return dateB - dateA
        case 'oldest':
          return dateA - dateB
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const handleDelete = async (lookId: string) => {
    if (!confirm('Are you sure you want to delete this look?')) return
    
    try {
      await deleteLook(lookId)
      setSavedLooks(prev => prev.filter(look => look.id !== lookId))
      if (selectedLook?.id === lookId) setSelectedLook(null)
    } catch (error) {
      console.error('Failed to delete look:', error)
      alert('Failed to delete look. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back</span>
              </Link>
              <img 
                src="/NailXR-symbol.png" 
                alt="NailXR" 
                className="h-8 w-8"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Saved Looks</h1>
                <p className="text-gray-600">
                  {savedLooks.length} saved looks
                </p>
              </div>
            </div>

            <Link 
              href="/try-on"
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-shadow"
            >
              <Plus className="h-5 w-5" />
              Create New Look
            </Link>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Filters and Search */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your looks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>

              {/* Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-5 w-5" />
                Filters
              </button>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && allTags.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white rounded-lg border border-gray-200 p-4 mb-6 overflow-hidden"
                >
                  <h3 className="font-semibold text-gray-900 mb-3">Filter by Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTag(null)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        !selectedTag
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`px-3 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                          selectedTag === tag
                            ? 'bg-pink-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            {viewMode === 'grid' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLooks.map((look) => (
                  <motion.div
                    key={look.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {/* Image Preview */}
                    <div className="h-48 bg-gray-100 relative group">
                      {look.preview_image_url ? (
                        <img 
                          src={look.preview_image_url} 
                          alt={look.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-pink-50 to-purple-50">
                         <HandModel
                            nailColor={look.color_hex}
                            nailStyle="Active" // Default or extract from notes/metadata
                            handSide="right"
                            interactive={false}
                          />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{look.name}</h3>
                        {/* Favorite button could be added here if supported by DB schema */}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-200" 
                          style={{ backgroundColor: look.color_hex }}
                        />
                        <span className="text-sm text-gray-600">{look.color_hex}</span>
                      </div>
                      
                      {look.notes && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{look.notes}</p>
                      )}

                      {/* Stats */}
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                         <span>{format(new Date(look.created_at || Date.now()), 'MMM dd')}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedLook(look)}
                          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(look.id)}
                          className="p-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {filteredLooks.map((look) => (
                  <motion.div
                    key={look.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center gap-6">
                      {/* Preview */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {look.preview_image_url ? (
                          <img 
                            src={look.preview_image_url} 
                            alt={look.name}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-pink-50 to-purple-50">
                             <span className="text-xs">3D View</span>
                           </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{look.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-200" 
                                style={{ backgroundColor: look.color_hex }}
                              />
                              <p className="text-gray-600">{look.color_hex}</p>
                            </div>
                          </div>
                        </div>

                        {look.notes && (
                          <p className="text-gray-500 mb-3">{look.notes}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Created {format(new Date(look.created_at || Date.now()), 'MMM dd, yyyy')}</span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedLook(look)}
                              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                              <Share2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(look.id)}
                              className="p-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredLooks.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No looks found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Start creating your first nail art design'}
                </p>
                <Link
                  href="/try-on"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Look
                </Link>
              </div>
            )}
          </div>

          {/* Detail Modal */}
          <AnimatePresence>
            {selectedLook && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={() => setSelectedLook(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                >
                  <div className="flex h-[600px]">
                    {/* Preview */}
                    <div className="flex-1 bg-gray-100 relative">
                      {selectedLook.preview_image_url ? (
                        <img
                          src={selectedLook.preview_image_url}
                          alt={selectedLook.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-pink-50 to-purple-50">
                          <HandModel
                            nailColor={selectedLook.color_hex}
                            nailStyle="Active"
                            handSide="right"
                            interactive={true}
                          />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="w-80 p-6 overflow-y-auto">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedLook.name}</h2>
                        <button
                          onClick={() => setSelectedLook(null)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          ×
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Color</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: selectedLook.color_hex }}
                            />
                            <span className="text-sm text-gray-600">{selectedLook.color_hex}</span>
                          </div>
                        </div>

                        {selectedLook.notes && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                            <p className="text-gray-600">{selectedLook.notes}</p>
                          </div>
                        )}

                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Created</h3>
                          <p className="text-gray-600">{format(new Date(selectedLook.created_at || Date.now()), 'MMMM dd, yyyy')}</p>
                        </div>

                        <div className="space-y-3 pt-4">
                          <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Book Appointment
                          </button>
                          <div className="flex gap-2">
                            <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                              <Share2 className="h-4 w-4" />
                              Share
                            </button>
                            <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                              <Download className="h-4 w-4" />
                              Export
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
