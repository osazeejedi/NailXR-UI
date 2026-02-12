'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Sparkles, Check, ArrowRight, Building, Palette, TrendingUp,
  Users, Shield, Zap, DollarSign, Star
} from 'lucide-react'
import { SUBSCRIPTION_PLANS, PaymentService } from '@/lib/payment'

export default function OnboardingLanding() {
  const plans = [
    SUBSCRIPTION_PLANS.starter,
    SUBSCRIPTION_PLANS.professional,
    SUBSCRIPTION_PLANS.enterprise
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">14-Day Free Trial • No Credit Card Required</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Launch Your Own
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Branded </span>
              Nail AR Platform
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Get your fully customized white-label nail visualization platform up and running in minutes.
              Complete branding control, powerful features, and zero technical hassle.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding/wizard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-shadow flex items-center gap-3"
                >
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
              
              <Link href="/white-label-demo">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-gray-300 text-gray-700 px-10 py-5 rounded-full text-lg font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  View Demo
                </motion.button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Takes less than 5 minutes to set up • Platform goes live immediately
            </p>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              { icon: Users, label: '50+ Clients', sublabel: 'Trust NailXR' },
              { icon: Shield, label: '99.9% Uptime', sublabel: 'Guaranteed' },
              { icon: Zap, label: 'Instant Setup', sublabel: 'Live in Minutes' },
              { icon: Star, label: '4.9/5 Rating', sublabel: 'Client Satisfaction' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-bold text-gray-900">{stat.label}</p>
                <p className="text-sm text-gray-600">{stat.sublabel}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your business. Start with 14 days free.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.tier === 'professional'
                    ? 'ring-2 ring-blue-600 scale-105'
                    : 'border-2 border-gray-200'
                }`}
              >
                {plan.tier === 'professional' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-5xl font-bold text-gray-900">
                      {PaymentService.formatPrice(plan.monthlyFee)}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    + {PaymentService.formatPrice(plan.setupFee)} setup fee
                  </p>
                  <p className="text-sm font-medium text-green-600 mt-2">
                    {plan.trialDays} days free trial
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/onboarding/wizard">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 rounded-lg font-semibold transition-all ${
                      plan.tier === 'professional'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Start Free Trial
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-gray-600 mt-8">
            All plans include 14-day free trial • Cancel anytime • No credit card required to start
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600">
              Complete white-label solution with all the features your clients expect
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Palette,
                title: 'Full Brand Customization',
                description: 'Your colors, your logo, your domain. Complete visual control over every aspect.'
              },
              {
                icon: Building,
                title: 'Instant Subdomain',
                description: 'Get yourbrand.nailxr.com activated immediately after signup.'
              },
              {
                icon: DollarSign,
                title: 'Revenue Sharing',
                description: 'Earn commission on every booking made through your platform.'
              },
              {
                icon: TrendingUp,
                title: 'Analytics Dashboard',
                description: 'Track visitors, bookings, revenue, and growth metrics in real-time.'
              },
              {
                icon: Zap,
                title: 'AR Virtual Try-On',
                description: 'Cutting-edge augmented reality technology for nail visualization.'
              },
              {
                icon: Users,
                title: 'Multi-User Support',
                description: 'Invite team members with role-based access control.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Launch Your Platform?
            </h2>
            <p className="text-xl text-blue-100 mb-10">
              Join salons and beauty businesses already growing with NailXR
            </p>
            <Link href="/onboarding/wizard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 px-12 py-5 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-shadow inline-flex items-center gap-3"
              >
                Start Your 14-Day Free Trial
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
            <p className="mt-6 text-blue-100">
              No credit card required • Setup takes less than 5 minutes
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
