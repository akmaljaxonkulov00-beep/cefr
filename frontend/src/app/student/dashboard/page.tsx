'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface DashboardStats {
  totalAttempts: number
  ieltsAttempts: number
  cefrAttempts: number
  lastActivity: string | null
}

export default function StudentDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalAttempts: 0,
    ieltsAttempts: 0,
    cefrAttempts: 0,
    lastActivity: null
  })
  const [loading, setLoading] = useState(true)
  const [recentResults, setRecentResults] = useState([])

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [analyticsRes] = await Promise.allSettled([
          api.get('/api/analytics/my'),
        ])

        if (analyticsRes.status === 'fulfilled') {
          setStats(analyticsRes.value.data)
        }
      } catch (err) {
        console.error('Dashboard data error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Student Dashboard
      </h1>

      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm mb-1">Jami testlar</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm mb-1">IELTS testlar</p>
          <p className="text-3xl font-bold text-blue-600">{stats.ieltsAttempts || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm mb-1">CEFR testlar</p>
          <p className="text-3xl font-bold text-green-600">{stats.cefrAttempts || 0}</p>
        </div>
      </div>

      {/* Mock turlari */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div
          onClick={() => router.push('/student/ielts')}
          className="bg-gradient-to-br from-blue-500 to-blue-700 text-white
                     rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-3">🎓</div>
          <h2 className="text-xl font-bold mb-2">IELTS Mocklar</h2>
          <p className="text-blue-100 text-sm">
            Listening • Reading • Writing • Speaking
          </p>
          <p className="text-blue-200 text-xs mt-2">
            Band score: 4.0 – 9.0
          </p>
        </div>

        <div
          onClick={() => router.push('/student/cefr')}
          className="bg-gradient-to-br from-green-500 to-green-700 text-white
                     rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-3">📋</div>
          <h2 className="text-xl font-bold mb-2">CEFR Mocklar</h2>
          <p className="text-green-100 text-sm">
            Listening • Reading • Writing
          </p>
          <p className="text-green-200 text-xs mt-2">
            Daraja: A1 – C2
          </p>
        </div>
      </div>

      {/* So'nggi natijalar */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h2 className="text-lg font-bold mb-4">So'nggi natijalar</h2>
        {recentResults.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">📝</p>
            <p>Hali hech qanday test topshirilmagan</p>
            <button
              onClick={() => router.push('/student/ielts')}
              className="mt-3 text-blue-600 hover:underline text-sm"
            >
              Testni boshlash →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentResults.map((result: any) => (
              <div key={result.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{result.mockTitle}</p>
                  <p className="text-sm text-gray-500">{result.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{result.score}</p>
                  <p className="text-xs text-gray-400">{result.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
