// @ts-nocheck
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useUserCohorts } from '@/hooks/useCohort'
import { useEffectiveRole } from '@/lib/store'
import Link from 'next/link'
import { Play, Clock, CheckCircle, BookOpen, MessageSquare, Calendar } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { cohorts, loading: cohortsLoading } = useUserCohorts()
  const effectiveRole = useEffectiveRole()
  
  const currentCohort = cohorts[0]
  
  // Mock progress data
  const weekProgress = {
    currentWeek: 3,
    totalWeeks: 5,
    lessonsCompleted: 8,
    totalLessons: 12,
    nextLesson: 'VR Session: State Fluidity',
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-text-secondary mt-1">
            {currentCohort ? (
              <>Week {weekProgress.currentWeek} of {currentCohort.name}</>
            ) : (
              <>Your journey to nervous system mastery continues</>
            )}
          </p>
        </div>
        
        <Link href="/dashboard/curriculum" className="btn btn-teal self-start">
          <Play className="w-4 h-4 mr-2" />
          Continue Learning
        </Link>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Current Week Card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-np-teal-hover flex items-center justify-center">
              <Calendar className="w-5 h-5 text-np-teal" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Current Week</p>
              <p className="font-display text-xl font-semibold">Week {weekProgress.currentWeek}</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm">State Fluidity: Moving Between States</p>
        </div>

        {/* Lessons Progress */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-np-gold-hover flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-np-gold-dark" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Lessons Complete</p>
              <p className="font-display text-xl font-semibold">
                {weekProgress.lessonsCompleted}/{weekProgress.totalLessons}
              </p>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(weekProgress.lessonsCompleted / weekProgress.totalLessons) * 100}%` }}
            />
          </div>
        </div>

        {/* VR Sessions */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-np-coral-hover flex items-center justify-center">
              <Clock className="w-5 h-5 text-np-coral-dark" />
            </div>
            <div>
              <p className="text-sm text-text-muted">VR Sessions</p>
              <p className="font-display text-xl font-semibold">5 completed</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm">Next session available now</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Lessons */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="p-4 border-b border-border-light">
              <h2 className="font-display text-xl font-semibold">Week 3: State Fluidity</h2>
            </div>
            <div className="divide-y divide-border-light">
              {[
                { title: 'Understanding State Transitions', type: 'Video', duration: '12 min', completed: true },
                { title: 'The 8 Phases Deep Dive', type: 'Reading', duration: '15 min', completed: true },
                { title: 'VR Session: State Fluidity', type: 'Practice', duration: '25 min', completed: false, current: true },
                { title: 'Week 3 Reflection', type: 'Reflection', duration: '10 min', completed: false },
              ].map((lesson, i) => (
                <div 
                  key={i} 
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${lesson.current ? 'bg-np-teal-hover' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      lesson.completed 
                        ? 'bg-np-teal text-white' 
                        : lesson.current 
                          ? 'bg-np-teal/20 text-np-teal border-2 border-np-teal' 
                          : 'bg-gray-100 text-text-muted'
                    }`}>
                      {lesson.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{i + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${lesson.current ? 'text-np-teal' : ''}`}>
                        {lesson.title}
                      </p>
                      <p className="text-sm text-text-muted">{lesson.type} • {lesson.duration}</p>
                    </div>
                  </div>
                  {lesson.current && (
                    <Link href="/dashboard/curriculum/lesson/3" className="btn btn-teal btn-sm">
                      Start
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Reflection */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Today's Reflection</h2>
            <p className="text-text-secondary mb-4">
              What nervous system patterns did you notice today?
            </p>
            <textarea 
              className="input min-h-[100px] resize-none mb-4"
              placeholder="Take a moment to reflect on how your body responded to today's experiences..."
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">0/500 characters</span>
              <div className="flex gap-2">
                <button className="btn btn-teal btn-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Save to Journal
                </button>
                <button className="btn btn-teal btn-sm">
                  Save & Share with Community
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Announcements */}
          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Announcements</h3>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-np-coral-hover flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-np-coral" />
              </div>
              <div>
                <p className="text-sm">
                  <span className="badge badge-coral mb-1">New</span>
                </p>
                <p className="text-sm">
                  Week 3 live Q&A session scheduled for Thursday at 7pm EST. Bring your questions!
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="card p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-3">
              <a href="#" className="flex items-center gap-3 text-text-secondary hover:text-text-primary transition-colors">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">Participant Guide (PDF)</span>
              </a>
              <a href="#" className="flex items-center gap-3 text-text-secondary hover:text-text-primary transition-colors">
                <Clock className="w-4 h-4" />
                <span className="text-sm">xRegulation Session Tracker</span>
              </a>
              <a href="#" className="flex items-center gap-3 text-text-secondary hover:text-text-primary transition-colors">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Book Facilitator Call</span>
              </a>
            </div>
          </div>

          {/* Need Help */}
          <div className="card p-6 bg-gradient-to-br from-np-blue to-np-teal text-white">
            <h3 className="font-display text-lg font-semibold mb-2">Need Help?</h3>
            <p className="text-sm opacity-90 mb-4">
              Our team is here to support your journey.
            </p>
            <div className="space-y-2">
              <button className="w-full btn bg-white/20 hover:bg-white/30 text-white border-0 btn-sm justify-start">
                Tech Support
              </button>
              <button className="w-full btn bg-white/20 hover:bg-white/30 text-white border-0 btn-sm justify-start">
                Talk to Facilitator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
