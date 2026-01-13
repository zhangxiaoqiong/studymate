import React, { useState, useEffect } from 'react'

const ModelSwitcher = () => {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [configs, setConfigs] = useState([])

  const API_BASE_URL = '/api'

  useEffect(() => {
    loadActiveConfig()
  }, [])

  const loadActiveConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user_config`)
      if (response.ok) {
        const data = await response.json()
        const activeConfig = data.configs?.find(c => c.is_active)
        setConfig(activeConfig)
        setConfigs(data.configs || [])
      }
    } catch (error) {
      console.error('Failed to load active config:', error)
    }
  }

  const switchConfig = async (configId) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/activate_config_by_id/${configId}`, {
        method: 'POST',
      })
      if (response.ok) {
        await loadActiveConfig()
        setShowMenu(false)
      }
    } catch (error) {
      console.error('Failed to switch config:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!config) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg hover:border-blue-400 transition-colors"
        title={`当前模型: ${config.model_name}`}
      >
        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {config.model_name}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-40 min-w-[200px]">
          <div className="max-h-48 overflow-y-auto">
            {configs.map((cfg) => (
              <button
                key={cfg.id}
                onClick={() => switchConfig(cfg.id)}
                disabled={loading || cfg.is_active}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  cfg.is_active
                    ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-2">
                  {cfg.is_active && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>}
                  <div>
                    <div className="font-medium">{cfg.config_name}</div>
                    <div className="text-xs text-gray-500">{cfg.model_name}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelSwitcher
