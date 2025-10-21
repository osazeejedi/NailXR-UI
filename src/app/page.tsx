'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Camera, Palette, MapPin, Star, ArrowRight, Play } from 'lucide-react'

// Dynamically import HandModel to avoid SSR issues
const HandModel = dynamic(() => import('@/components/3d/HandModel'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400">Loading 3D Model...</div>
    </div>
  )
})

const nailColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F0A0A0', '#FFB347', '#87CEEB', '#98FB98'
]

const nailStyles = [
  { name: 'Classic', category: 'traditional' },
  { name: 'French', category: 'elegant' },
  { name: 'Gradient', category: 'modern' },
  { name: 'Glitter', category: 'glamorous' },
  { name: 'Matte', category: 'sophisticated' }
]

export default function HomePage() {
  const [selectedColor, setSelectedColor] = useState('#FF6B6B')
  const [selectedStyle, setSelectedStyle] = useState('Classic')
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:pr-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src="/NailXR-symbol.png" 
                  alt="NailXR" 
                  className="h-8 w-8"
                />
                <span className="text-pink-600 font-semibold">AI-Powered Nail Visualization</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Try Before You
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600"> Apply</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Experience the future of nail art with NailXR. Visualize thousands of nail designs on realistic 3D hands, 
                save your favorite looks, and book appointments with top salons near you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/try-on">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Camera className="h-5 w-5" />
                    Try Virtual Try-On
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-full font-semibold flex items-center gap-2 hover:border-pink-300 hover:text-pink-600 transition-colors"
                >
                  <Play className="h-5 w-5" />
                  Watch Demo
                </motion.button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">500+</div>
                  <div className="text-gray-600">Nail Designs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">1000+</div>
                  <div className="text-gray-600">Partner Salons</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">50K+</div>
                  <div className="text-gray-600">Happy Users</div>
                </div>
              </div>
            </motion.div>
            
            {/* Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl p-8"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Live Preview</h3>
                <p className="text-gray-600">Customize your nail design in real-time</p>
              </div>
              
              {/* 3D Hand Model */}
              <div className="h-[400px] mb-6">
                <HandModel 
                  nailColor={selectedColor} 
                  nailStyle={selectedStyle}
                  interactive={true}
                />
              </div>
              
              {/* Color Selection */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Choose Color</h4>
                <div className="grid grid-cols-5 gap-2">
                  {nailColors.map((color) => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-full border-4 ${
                        selectedColor === color ? 'border-gray-900' : 'border-gray-200'
                      } transition-colors`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Style Selection */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Choose Style</h4>
                <div className="grid grid-cols-2 gap-2">
                  {nailStyles.map((style) => (
                    <motion.button
                      key={style.name}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedStyle(style.name)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        selectedStyle === style.name
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 text-gray-700 hover:border-pink-300'
                      }`}
                    >
                      {style.name}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Palette className="h-4 w-4" />
                  Save Look
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 border-2 border-pink-500 text-pink-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Find Salon
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Background Decorations */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-40 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose NailXR?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the perfect blend of technology and beauty with our cutting-edge features
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Camera className="h-8 w-8" />,
                title: 'AI Virtual Try-On',
                description: 'See how any nail design looks on your hands using advanced AR technology'
              },
              {
                icon: <Palette className="h-8 w-8" />,
                title: '500+ Designs',
                description: 'Explore thousands of nail art designs from classic to contemporary styles'
              },
              {
                icon: <MapPin className="h-8 w-8" />,
                title: 'Salon Booking',
                description: 'Book appointments with verified salons and nail technicians near you'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-pink-500 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Chen',
                role: 'Beauty Enthusiast',
                content: 'NailXR completely changed how I choose nail designs. I can try dozens of looks before my appointment!',
                rating: 5
              },
              {
                name: 'Maria Rodriguez',
                role: 'Salon Owner',
                content: 'My clients love showing me exactly what they want. It\'s revolutionized our consultation process.',
                rating: 5
              },
              {
                name: 'Emma Thompson',
                role: 'Fashion Blogger',
                content: 'The 3D visualization is incredible. I use NailXR for all my content planning and nail inspiration.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-8 rounded-xl"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
