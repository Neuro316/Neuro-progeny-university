// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSupabase } from '@/lib/supabase/client'
import { Save, User, Phone, MapPin, Heart, Briefcase, Shield, Bell, Loader2, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react'

interface ProfileData {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: string
  bio: string | null
  goals_text: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  date_of_birth: string | null
  gender: string | null
  pronouns: string | null
  occupation: string | null
  industry: string | null
  education_level: string | null
  marital_status: string | null
  has_children: boolean | null
  number_of_children: number | null
  stress_level_baseline: number | null
  sleep_quality_baseline: number | null
  exercise_frequency: string | null
  previous_therapy_experience: boolean | null
  previous_meditation_experience: boolean | null
  referral_source: string | null
  how_heard_about_us: string | null
  timezone: string | null
  preferred_contact_method: string | null
  communication_frequency_preference: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  marketing_consent: boolean | null
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'goals' | 'contact' | 'demographics' | 'wellness' | 'preferences'>('basic')

  useEffect(() => {
    if (user?.id) fetchProfile()
  }, [user?.id])

  const fetchProfile = async () => {
    const supabase = getSupabase()
    if (!supabase || !user?.id) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    setSaved(false)

    const supabase = getSupabase()
    if (!supabase) return

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
        goals_text: profile.goals_text,
        phone: profile.phone,
        address_line1: profile.address_line1,
        address_line2: profile.address_line2,
        city: profile.city,
        state: profile.state,
        postal_code: profile.postal_code,
        country: profile.country,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        pronouns: profile.pronouns,
        occupation: profile.occupation,
        industry: profile.industry,
        education_level: profile.education_level,
        marital_status: profile.marital_status,
        has_children: profile.has_children,
        number_of_children: profile.number_of_children,
        stress_level_baseline: profile.stress_level_baseline,
        sleep_quality_baseline: profile.sleep_quality_baseline,
        exercise_frequency: profile.exercise_frequency,
        previous_therapy_experience: profile.previous_therapy_experience,
        previous_meditation_experience: profile.previous_meditation_experience,
        referral_source: profile.referral_source,
        how_heard_about_us: profile.how_heard_about_us,
        timezone: profile.timezone,
        preferred_contact_method: profile.preferred_contact_method,
        communication_frequency_preference: profile.communication_frequency_preference,
        emergency_contact_name: profile.emergency_contact_name,
        emergency_contact_phone: profile.emergency_contact_phone,
        emergency_contact_relationship: profile.emergency_contact_relationship,
        marketing_consent: profile.marketing_consent,
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const updateField = (field: keyof ProfileData, value: any) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-np-teal" />
      </div>
    )
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'goals', label: 'Goals & Intentions', icon: Heart },
    { id: 'contact', label: 'Contact & Address', icon: MapPin },
    { id: 'demographics', label: 'Demographics', icon: Briefcase },
    { id: 'wellness', label: 'Wellness Background', icon: Heart },
    { id: 'preferences', label: 'Preferences', icon: Bell },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary">Your Profile</h1>
          <p className="text-text-secondary mt-1">Manage your account and personal information</p>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-np-teal text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-np-teal to-np-teal/70 flex items-center justify-center text-white text-2xl font-bold">
              {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.full_name || 'Your Name'}</h2>
              <p className="text-text-muted">{profile?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-np-teal/10 text-np-teal rounded-full capitalize">
                {profile?.role || 'Participant'}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profile?.full_name || ''}
                onChange={e => updateField('full_name', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pronouns</label>
              <select
                value={profile?.pronouns || ''}
                onChange={e => updateField('pronouns', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="">Select pronouns</option>
                <option value="he/him">He/Him</option>
                <option value="she/her">She/Her</option>
                <option value="they/them">They/Them</option>
                <option value="he/they">He/They</option>
                <option value="she/they">She/They</option>
                <option value="other">Other</option>
                <option value="prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <p className="text-xs text-gray-500 mb-2">This may be visible to other community members</p>
            <textarea
              value={profile?.bio || ''}
              onChange={e => updateField('bio', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              rows={3}
              placeholder="Tell us a bit about yourself..."
            />
          </div>
        </div>
      )}

      {/* Goals & Intentions Tab */}
      {activeTab === 'goals' && (
        <div className="card p-6 space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
            <h3 className="font-medium text-purple-900 mb-2">What brings you here?</h3>
            <p className="text-sm text-purple-700">
              Share 1-3 things you are hoping to change, improve, or experience through this program. 
              This helps us understand your journey and tailor your experience.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Goals & Intentions</label>
            <textarea
              value={profile?.goals_text || ''}
              onChange={e => updateField('goals_text', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              rows={6}
              placeholder="Example:
1. I want to feel less reactive when stress hits and be able to stay grounded
2. I'm hoping to improve my sleep quality and wake up feeling more rested
3. I want to build a sustainable daily practice that actually fits my busy schedule"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
            <input
              type="text"
              value={profile?.how_heard_about_us || ''}
              onChange={e => updateField('how_heard_about_us', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              placeholder="Friend referral, social media, podcast, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referral Source</label>
            <select
              value={profile?.referral_source || ''}
              onChange={e => updateField('referral_source', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="friend_family">Friend or Family</option>
              <option value="social_media">Social Media</option>
              <option value="google_search">Google Search</option>
              <option value="podcast">Podcast</option>
              <option value="healthcare_provider">Healthcare Provider</option>
              <option value="therapist_coach">Therapist or Coach</option>
              <option value="conference_event">Conference or Event</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      )}

      {/* Contact & Address Tab */}
      {activeTab === 'contact' && (
        <div className="card p-6 space-y-6">
          <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Private Information</h3>
              <p className="text-sm text-blue-700">
                Your contact information and address are private and will not be visible to other community members.
                This information is used only for program administration and shipping (if applicable).
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={profile?.phone || ''}
                onChange={e => updateField('phone', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={profile?.timezone || ''}
                onChange={e => updateField('timezone', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="">Select timezone</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Anchorage">Alaska Time (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                <option value="Europe/London">UK Time (GMT/BST)</option>
                <option value="Europe/Paris">Central European (CET)</option>
                <option value="Australia/Sydney">Australian Eastern (AEST)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
            <input
              type="text"
              value={profile?.address_line1 || ''}
              onChange={e => updateField('address_line1', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              placeholder="Street address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
            <input
              type="text"
              value={profile?.address_line2 || ''}
              onChange={e => updateField('address_line2', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              placeholder="Apartment, suite, unit, etc. (optional)"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={profile?.city || ''}
                onChange={e => updateField('city', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
              <input
                type="text"
                value={profile?.state || ''}
                onChange={e => updateField('state', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={profile?.postal_code || ''}
                onChange={e => updateField('postal_code', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={profile?.country || ''}
              onChange={e => updateField('country', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              placeholder="United States"
            />
          </div>

          {/* Emergency Contact */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              Emergency Contact
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              For intensive programs, we may need to contact someone in case of emergency.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={profile?.emergency_contact_name || ''}
                  onChange={e => updateField('emergency_contact_name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profile?.emergency_contact_phone || ''}
                  onChange={e => updateField('emergency_contact_phone', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <input
                  type="text"
                  value={profile?.emergency_contact_relationship || ''}
                  onChange={e => updateField('emergency_contact_relationship', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                  placeholder="Spouse, Parent, Friend, etc."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demographics Tab */}
      {activeTab === 'demographics' && (
        <div className="card p-6 space-y-6">
          <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-100">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900">For Research & Analytics Only</h3>
              <p className="text-sm text-amber-700">
                This demographic information is completely optional and will only be used in aggregate 
                for program improvement and research. It is never shared publicly or with other members.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={profile?.date_of_birth || ''}
                onChange={e => updateField('date_of_birth', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={profile?.gender || ''}
                onChange={e => updateField('gender', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
              <input
                type="text"
                value={profile?.occupation || ''}
                onChange={e => updateField('occupation', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                placeholder="Your job title or role"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                value={profile?.industry || ''}
                onChange={e => updateField('industry', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                placeholder="Healthcare, Technology, Education, etc."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
              <select
                value={profile?.education_level || ''}
                onChange={e => updateField('education_level', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="">Prefer not to say</option>
                <option value="high_school">High School</option>
                <option value="some_college">Some College</option>
                <option value="associates">Associate Degree</option>
                <option value="bachelors">Bachelor Degree</option>
                <option value="masters">Master Degree</option>
                <option value="doctorate">Doctorate</option>
                <option value="professional">Professional Degree (MD, JD, etc.)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
              <select
                value={profile?.marital_status || ''}
                onChange={e => updateField('marital_status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="">Prefer not to say</option>
                <option value="single">Single</option>
                <option value="partnered">Partnered</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Do you have children?</label>
              <select
                value={profile?.has_children === null ? '' : profile?.has_children ? 'yes' : 'no'}
                onChange={e => updateField('has_children', e.target.value === 'yes')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="">Prefer not to say</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {profile?.has_children && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Children</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={profile?.number_of_children || ''}
                  onChange={e => updateField('number_of_children', parseInt(e.target.value) || null)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wellness Background Tab */}
      {activeTab === 'wellness' && (
        <div className="card p-6 space-y-6">
          <div className="flex items-start gap-3 bg-green-50 rounded-xl p-4 border border-green-100">
            <Heart className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900">Wellness Background</h3>
              <p className="text-sm text-green-700">
                This helps us understand where you are starting from and track your progress over time.
                All information is kept confidential.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Baseline Stress Level <span className="text-gray-400">(1-10)</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">How would you rate your typical stress level?</p>
              <input
                type="range"
                min="1"
                max="10"
                value={profile?.stress_level_baseline || 5}
                onChange={e => updateField('stress_level_baseline', parseInt(e.target.value))}
                className="w-full accent-np-teal"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 - Very Low</span>
                <span className="font-medium text-np-teal">{profile?.stress_level_baseline || 5}</span>
                <span>10 - Very High</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Baseline Sleep Quality <span className="text-gray-400">(1-10)</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">How would you rate your typical sleep quality?</p>
              <input
                type="range"
                min="1"
                max="10"
                value={profile?.sleep_quality_baseline || 5}
                onChange={e => updateField('sleep_quality_baseline', parseInt(e.target.value))}
                className="w-full accent-np-teal"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 - Very Poor</span>
                <span className="font-medium text-np-teal">{profile?.sleep_quality_baseline || 5}</span>
                <span>10 - Excellent</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Frequency</label>
            <select
              value={profile?.exercise_frequency || ''}
              onChange={e => updateField('exercise_frequency', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="never">Rarely or never</option>
              <option value="monthly">A few times a month</option>
              <option value="weekly_1_2">1-2 times per week</option>
              <option value="weekly_3_4">3-4 times per week</option>
              <option value="daily">5+ times per week</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous therapy or counseling experience?</label>
              <select
                value={profile?.previous_therapy_experience === null ? '' : profile?.previous_therapy_experience ? 'yes' : 'no'}
                onChange={e => updateField('previous_therapy_experience', e.target.value === 'yes')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="">Prefer not to say</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous meditation or mindfulness experience?</label>
              <select
                value={profile?.previous_meditation_experience === null ? '' : profile?.previous_meditation_experience ? 'yes' : 'no'}
                onChange={e => updateField('previous_meditation_experience', e.target.value === 'yes')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="">Prefer not to say</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="card p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact Method</label>
              <select
                value={profile?.preferred_contact_method || ''}
                onChange={e => updateField('preferred_contact_method', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="email">Email</option>
                <option value="phone">Phone Call</option>
                <option value="text">Text Message</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Communication Frequency</label>
              <select
                value={profile?.communication_frequency_preference || ''}
                onChange={e => updateField('communication_frequency_preference', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-np-teal focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="daily">Daily updates are fine</option>
                <option value="weekly">Weekly summaries preferred</option>
                <option value="minimal">Only essential communications</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile?.marketing_consent || false}
                onChange={e => updateField('marketing_consent', e.target.checked)}
                className="mt-1 rounded border-gray-300 text-np-teal focus:ring-np-teal"
              />
              <div>
                <span className="font-medium text-gray-900">Marketing Communications</span>
                <p className="text-sm text-gray-500">
                  I agree to receive occasional emails about new programs, resources, and updates from Neuro Progeny.
                  You can unsubscribe at any time.
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Save Button (mobile sticky) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4">
        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-np-teal text-white rounded-lg hover:bg-[#2d7a7a] disabled:opacity-50 shadow-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
