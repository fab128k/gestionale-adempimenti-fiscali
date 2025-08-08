// ============================================
// 4. UPDATED DASHBOARD PAGE
// app/dashboard/page.tsx
// ============================================

import { StatsGrid } from '@/components/dashboard/stats-grid'
import { AIInsightsPanel } from '@/components/dashboard/ai-insights-panel'
import { RecentDeadlines } from '@/components/dashboard/recent-deadlines'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">
          Benvenuto nel tuo gestionale fiscale intelligente
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Deadlines */}
          <RecentDeadlines />
          
          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* AI Insights */}
          <AIInsightsPanel />
          
          {/* Activity Feed */}
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
