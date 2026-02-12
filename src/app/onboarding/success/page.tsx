'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  PartyPopper, Check, Mail, Globe, Calendar, ArrowRight, 
  Shield, Sparkles, ExternalLink
} from 'lucide-react'

export default function OnboardingSuccess() {
  const [confettiActive, setConfettiActive] = useState(true)

  useEffect(() => {
    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setConfettiActive(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  // In production, these would come from the API response or URL params
  const platformUrl = 'https://my-salon.nailxr.com'
  const email = 'owner@mysalon.com'
  const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex w-24 h-24 bg-gradient-to-r from-green-500 to-blue-600 rounded-full items-center justify-center mb-6 shadow-2xl">
            <PartyPopper className="h-12 w-12 text-white" />
          </div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-gray-900 mb-4"
          >
            🎉 Your Platform is Live!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600"
          >
            Congratulations! Your white-label nail AR platform is ready to use
          </motion.p>
        </motion.div>

        {/* Platform Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Platform Details</h2>
          </div>

          <div className="space-y-4">
            {/* Platform URL */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-gray-900">Your Platform URL:</p>
              </div>
              <a
                href={platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-semibold hover:underline flex items-center gap-2 text-lg"
              >
                {platformUrl}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Email Notification */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-green-600" />
                <p className="font-medium text-gray-900">Check Your Email:</p>
              </div>
              <p className="text-gray-700">
                Login credentials have been sent to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Don't see it? Check your spam folder
              </p>
            </div>

            {/* Trial End Date */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <p className="font-medium text-gray-900">Trial Period:</p>
              </div>
              <p className="text-gray-700">
                Your 14-day free trial ends on <strong>{trialEndDate}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                We'll send you a reminder 3 days before
              </p>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Next Steps</h2>
          
          <div className="space-y-4">
            {[
              {
                icon: Mail,
                title: '1. Check Your Email',
                description: 'Look for your login credentials and welcome guide'
              },
              {
                icon: Globe,
                title: '2. Access Your Dashboard',
                description: 'Log in to customize your platform and explore features'
              },
              {
                icon: Sparkles,
                title: '3. Customize Your Platform',
                description: 'Upload logos, adjust settings, and make it yours'
              },
              {
                icon: Shield,
                title: '4. Start Using',
                description: 'Share with clients and start accepting bookings'
              }
            ].map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <step.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/" className="flex-1">
            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2">
              Go to Main Site
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>

          <a href={platformUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <button className="w-full border-2 border-blue-600 text-blue-600 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              Visit Your Platform
              <ExternalLink className="h-5 w-5" />
            </button>
          </a>
        </motion.div>

        {/* Support Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center text-gray-600"
        >
          <p className="mb-2">Need help getting started?</p>
          <p>
            <a href="mailto:support@nailxr.com" className="text-blue-600 hover:underline font-medium">
              Contact Support
            </a>
            {' '}or{' '}
            <a href="/docs" className="text-blue-600 hover:underline font-medium">
              View Documentation
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
