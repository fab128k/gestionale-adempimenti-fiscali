// ============================================
// DASHBOARD PAGE - VERSIONE CORRETTA
// app/dashboard/page.tsx
// ============================================

import { StatsGrid } from '@/components/dashboard/stats-grid'
import { AIInsightsPanel } from '@/components/dashboard/ai-insights-panel'
import { RecentDeadlines } from '@/components/dashboard/recent-deadlines'

export default function DashboardPage() {
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Buongiorno' : currentHour < 18 ? 'Buon pomeriggio' : 'Buonasera'

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}! 👋</h1>
        <p className="text-gray-600 text-sm mt-1">
          Ecco un riepilogo delle tue attività e scadenze
        </p>
      </div>

      {/* Stats Grid - Full Width */}
      <StatsGrid />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Deadlines */}
          <RecentDeadlines />
          
          {/* Placeholder for Quick Actions - Coming Soon */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-400">
              <svg 
                className="mx-auto h-12 w-12 mb-3" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Quick Actions
              </h3>
              <p className="text-xs text-gray-500">
                Prossimamente: Azioni rapide per velocizzare il tuo workflow
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width on large screens */}
        <div className="space-y-6">
          {/* AI Insights */}
          <AIInsightsPanel />
          
          {/* Placeholder for Activity Feed - Coming Soon */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-400">
              <svg 
                className="mx-auto h-12 w-12 mb-3" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Activity Feed
              </h3>
              <p className="text-xs text-gray-500">
                Prossimamente: Timeline delle attività recenti
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
