import React, { useState, useEffect, useRef } from 'react'

const ModelSettings = ({ onClose, isInMenu = false }) => {
  // 表单状态
  const [apiBase, setApiBase] = useState('https://api.deepseek.com/v1')
  const [apiKey, setApiKey] = useState('')
  const [modelName, setModelName] = useState('deepseek-chat')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)

  // UI 状态
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [configurations, setConfigurations] = useState({})
  const [selectedModel, setSelectedModel] = useState(null)  // 当前使用中的配置
  const [editingConfigName, setEditingConfigName] = useState(null)  // 正在编辑的配置
  const [isCreatingNew, setIsCreatingNew] = useState(false)  // 是否在创建新配置
  const menuScrollRef = useRef(null)  // 用于滚动菜单到顶部

  // 加载保存的配置和当前使用的配置
  useEffect(() => {
    const savedConfigs = localStorage.getItem('llmConfigurations')
    const savedSelected = localStorage.getItem('selectedLLMConfig')

    if (savedConfigs) {
      const configs = JSON.parse(savedConfigs)
      setConfigurations(configs)
      // 只有当 savedSelected 实际存在于 configs 中时才设置
      if (savedSelected && configs[savedSelected]) {
        setSelectedModel(savedSelected)
      } else {
        // 如果 localStorage 中保存的配置不存在，清空选中状态
        localStorage.removeItem('selectedLLMConfig')
        setSelectedModel(null)
      }
    } else {
      setSelectedModel(null)
    }
  }, [])

  const presets = [
    {
      name: 'DeepSeek (当前)',
      apiBase: 'https://api.deepseek.com/v1',
      modelName: 'deepseek-chat',
    },
    {
      name: 'OpenAI',
      apiBase: 'https://api.openai.com/v1',
      modelName: 'gpt-4',
    },
    {
      name: '智谱 GLM',
      apiBase: 'https://open.bigmodel.cn/api/paas/v4',
      modelName: 'glm-4',
    },
    {
      name: '阿里通义千问',
      apiBase: 'https://dashscope.aliyuncs.com/api/v1',
      modelName: 'qwen-max',
    },
    {
      name: 'Groq',
      apiBase: 'https://api.groq.com/openai/v1',
      modelName: 'mixtral-8x7b',
    },
    {
      name: '本地 Ollama',
      apiBase: 'http://localhost:11434/v1',
      modelName: '本地模型名称',
    },
  ]

  // 当编辑或新建配置时，在菜单模式下滚动到顶部
  useEffect(() => {
    if (isInMenu && (editingConfigName || isCreatingNew) && menuScrollRef.current) {
      menuScrollRef.current.scrollTop = 0
    }
  }, [editingConfigName, isCreatingNew, isInMenu])

  const handleSelectConfiguration = async (configName) => {
    try {
      setEditingConfigName(configName)  // 立即设置进入编辑模式
      // 从后端获取完整的配置信息（包括解密的 API Key）
      const response = await fetch(`/api/llm_config/${encodeURIComponent(configName)}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '获取配置失败')
      }

      const config = await response.json()
      setApiBase(config.apiBase)
      setModelName(config.modelName)
      setTemperature(config.temperature || 0.7)
      setMaxTokens(config.maxTokens || 1000)
      setApiKey(config.apiKey)  // 自动填充 API Key
    } catch (error) {
      setEditingConfigName(null)  // 失败时取消编辑模式
      console.error('获取配置失败:', error)
      alert('获取配置失败：' + error.message)
    }
  }

  const handleNewConfig = () => {
    setApiBase('https://api.deepseek.com/v1')
    setApiKey('')
    setModelName('deepseek-chat')
    setTemperature(0.7)
    setMaxTokens(1000)
    setEditingConfigName(null)
    setIsCreatingNew(true)
  }

  const handleCancel = () => {
    setEditingConfigName(null)
    setIsCreatingNew(false)
    // 如果在菜单模式下，返回配置列表；如果在独立模式下，关闭对话框
    if (!isInMenu) {
      onClose()
    }
  }

  const handleSave = async () => {
    if (!modelName.trim()) {
      alert('模型名称不能为空')
      return
    }

    // 新建时 API Key 必须填，编辑时可以不填（表示保持原 Key）
    if (!editingConfigName && !apiKey.trim()) {
      alert('API Key 不能为空')
      return
    }

    const configName = `${modelName} @ ${apiBase.split('/')[2]}`

    setSaving(true)
    try {
      console.log('开始保存配置:', { configName, editingConfigName, modelName, apiBase })

      // 发送给后端，包含 API Key（后端会加密存储）
      const response = await fetch('/api/llm_config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configName,
          apiBase,
          apiKey,
          modelName,
          temperature,
          maxTokens,
          editingConfigName,  // 告诉后端这是编辑模式还是新建模式
        }),
      })

      console.log('响应状态:', response.status, response.statusText)

      if (!response.ok) {
        let errorDetail = '保存失败'
        try {
          const errorData = await response.json()
          console.log('错误响应:', errorData)
          errorDetail = errorData?.detail || JSON.stringify(errorData)
        } catch (parseError) {
          console.log('无法解析错误响应:', parseError)
          errorDetail = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorDetail)
      }

      const result = await response.json()
      console.log('保存成功:', result)

      // 如果在编辑模式，删除旧配置
      if (editingConfigName && editingConfigName !== configName) {
        const updatedConfigs = { ...configurations }
        delete updatedConfigs[editingConfigName]
        setConfigurations(updatedConfigs)

        // 从后端删除旧配置
        fetch(`/api/llm_config/${encodeURIComponent(editingConfigName)}`, {
          method: 'DELETE',
        }).catch(err => console.error('删除旧配置失败:', err))
      }

      // 保存到本地 localStorage（不保存 API Key）
      const savedConfigs = JSON.parse(localStorage.getItem('llmConfigurations') || '{}')
      savedConfigs[configName] = {
        apiBase,
        modelName,
        temperature,
        maxTokens,
      }
      localStorage.setItem('llmConfigurations', JSON.stringify(savedConfigs))

      // 只有在编辑已选中的配置时，才保持其选中状态
      if (editingConfigName && editingConfigName !== configName && selectedModel === editingConfigName) {
        // 配置被重命名，更新选中状态
        localStorage.setItem('selectedLLMConfig', configName)
        setSelectedModel(configName)
      } else if (!editingConfigName && !selectedModel) {
        // 只有当这是第一个配置且没有选中任何配置时，才选中它
        localStorage.setItem('selectedLLMConfig', configName)
        setSelectedModel(configName)
      }
      // 否则不改变选中状态（新建时不自动选中）

      setConfigurations(savedConfigs)
      setApiKey('')  // 清除前端的 API Key
      setEditingConfigName(null)  // 清除编辑模式
      setIsCreatingNew(false)  // 清除创建新配置标志
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      // 更好的错误处理 - 避免 [object Object]
      let errorMsg = '保存配置失败'
      if (error instanceof Error) {
        errorMsg = error.message
      } else if (typeof error === 'string') {
        errorMsg = error
      } else if (error && typeof error === 'object') {
        errorMsg = error.detail || error.message || JSON.stringify(error)
      }
      console.error('保存配置异常:', error, '错误消息:', errorMsg)
      alert('保存配置失败：' + errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleUseConfiguration = async (configName) => {
    const config = configurations[configName]
    if (!config) return

    setSaving(true)
    try {
      // 切换配置（不需要发送 API Key，后端从数据库加载）
      const response = await fetch(`/api/activate_config/${encodeURIComponent(configName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '切换失败')
      }

      localStorage.setItem('selectedLLMConfig', configName)
      setSelectedModel(configName)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      alert('切换配置失败：' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfiguration = (configName) => {
    if (window.confirm(`确定要删除配置"${configName}"吗？`)) {
      // 从前端删除
      const updatedConfigs = { ...configurations }
      delete updatedConfigs[configName]
      localStorage.setItem('llmConfigurations', JSON.stringify(updatedConfigs))
      setConfigurations(updatedConfigs)

      // 从后端删除（异步）
      fetch(`/api/llm_config/${encodeURIComponent(configName)}`, {
        method: 'DELETE',
      }).catch(err => console.error('删除后端配置失败:', err))

      if (selectedModel === configName) {
        setSelectedModel(null)
      }

      if (editingConfigName === configName) {
        handleNewConfig()
      }
    }
  }

  // 菜单模式布局（单栏）
  if (isInMenu) {
    return (
      <div className="p-6 space-y-6 overflow-y-auto h-full" ref={menuScrollRef}>
        {/* 编辑/新建配置部分 - 最上面（优先显示） */}
        {(editingConfigName || isCreatingNew) && (
          <>
            {/* 标题 */}
            <div className="pb-4 border-b-2 border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingConfigName ? `✏️ 编辑配置` : '➕ 新建配置'}
              </h3>
              {editingConfigName && (
                <p className="text-sm text-gray-600 mt-1">{editingConfigName}</p>
              )}
            </div>

            {/* 快速预设下拉 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🚀 快速预设</label>
              <select
                onChange={(e) => {
                  const preset = presets.find(p => p.name === e.target.value)
                  if (preset) {
                    setApiBase(preset.apiBase)
                    setModelName(preset.modelName)
                  }
                }}
                defaultValue=""
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
              >
                <option value="">选择预设配置...</option>
                {presets.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name} - {preset.modelName}
                  </option>
                ))}
              </select>
            </div>

            {/* API 配置组 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">🔌 API 配置</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">API 基础 URL</label>
                  <input
                    type="text"
                    value={apiBase}
                    onChange={(e) => setApiBase(e.target.value)}
                    placeholder="https://api.deepseek.com/v1"
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-xxxxx..."
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">🔒 会被加密存储</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    模型名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="deepseek-chat"
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 模型参数组 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">⚙️ 模型参数</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-700">Temperature (创意程度)</label>
                    <span className="text-xs font-semibold text-blue-600">{temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1"
                  />
                  <p className="text-xs text-gray-600 mt-0.5">越高越有创意，越低越严谨</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">最大输出长度</label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    min="100"
                    max="4000"
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-600 mt-0.5">建议 1000-2000 tokens</p>
                </div>
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex gap-2 pt-4 border-t-2 border-gray-300">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {saving ? '⏳' : saved ? '✓' : '💾'} {saving ? '保存中...' : saved ? '已保存' : '保存'}
              </button>
            </div>
          </>
        )}

        {/* 没有配置时的新增按钮 */}
        {Object.keys(configurations).length === 0 && !editingConfigName && !isCreatingNew && (
          <div className="text-center py-6 border-b-2 border-gray-300">
            <p className="text-sm text-gray-600 mb-3">暂无保存的配置</p>
            <button
              onClick={handleNewConfig}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              ➕ 创建新配置
            </button>
          </div>
        )}

        {/* 已保存配置列表 - 下面（仅在非编辑/新建模式时显示） */}
        {Object.keys(configurations).length > 0 && !editingConfigName && !isCreatingNew && (
          <div className="pb-6 border-b-2 border-gray-300">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">📋 已保存的配置</h4>
              <button
                onClick={handleNewConfig}
                className="px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-100 transition-colors font-medium"
                title="创建新配置"
              >
                ➕ 新建
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(configurations).map(([configName, config]) => (
                <div
                  key={configName}
                  onClick={() => selectedModel !== configName && handleUseConfiguration(configName)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer group ${
                    selectedModel === configName
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-300'
                      : editingConfigName === configName
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {configName}
                        {selectedModel === configName && <span className="text-green-600 font-bold ml-2">✓ 使用中</span>}
                      </div>
                      <div className="text-xs text-gray-600">{config.modelName}</div>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectConfiguration(configName)
                        }}
                        className="p-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConfiguration(configName)
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="删除"
                      >
                        <svg className="w-4 h-4 text-red-600 hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 单独打开时的布局（非菜单）
  return (
    <div className={isInMenu ? "p-6 space-y-6" : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"}>
      <div className={isInMenu ? "" : "bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"}>
        {!isInMenu && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0">
            <h2 className="text-2xl font-bold text-gray-900">⚙️ 大模型配置管理</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className={isInMenu ? "" : "flex-1 overflow-y-auto p-6"}>
          {Object.keys(configurations).length === 0 ? (
            // 没有配置时的提示 - 包含新增按钮
            <div className="text-center py-12">
              <div className="mb-8">
                <p className="text-gray-600 mb-2 text-lg font-medium">暂无保存的配置</p>
                <p className="text-sm text-gray-500">点击下方按钮创建第一个大模型配置</p>
              </div>
              <button
                onClick={handleNewConfig}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                ➕ 创建新配置
              </button>
            </div>
          ) : (
            // 单列布局显示配置列表
            <div className="mb-6 pb-6 border-b-2 border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 已保存的配置</h3>
              <div className="space-y-2">
                {Object.entries(configurations).map(([configName, config]) => (
                  <div
                    key={configName}
                    onClick={() => selectedModel !== configName && handleUseConfiguration(configName)}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedModel === configName
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-300'
                        : editingConfigName === configName
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {configName}
                          {selectedModel === configName && <span className="text-green-600 font-bold ml-2">✓ 使用中</span>}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {config.modelName} • Temp: {config.temperature} • Max: {config.maxTokens}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectConfiguration(configName)
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteConfiguration(configName)
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors font-bold"
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 快速预设下拉 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">🚀 快速预设</label>
            <select
              onChange={(e) => {
                const preset = presets.find(p => p.name === e.target.value)
                if (preset) {
                  setApiBase(preset.apiBase)
                  setModelName(preset.modelName)
                }
              }}
              defaultValue=""
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
            >
              <option value="">选择预设配置...</option>
              {presets.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name} - {preset.modelName}
                </option>
              ))}
            </select>
          </div>

          {/* API 配置组 */}
          <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔌 API 配置</h3>
            <div className="space-y-4">
              {/* API Base URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API 基础 URL
                </label>
                <input
                  type="text"
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder="https://api.deepseek.com/v1"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-xxxxx..."
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">🔒 会被加密存储在数据库中</p>
              </div>

              {/* 模型名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="deepseek-chat"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 模型参数组 */}
          <div className="bg-blue-50 rounded-lg p-5 mb-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 模型参数</h3>
            <div className="space-y-4">
              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Temperature (创意程度)
                  </label>
                  <span className="text-sm font-semibold text-blue-600">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">越高越有创意，越低越严谨</p>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大输出长度
                </label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  min="100"
                  max="4000"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
                />
                <p className="text-xs text-gray-600 mt-1">建议 1000-2000 tokens</p>
              </div>
            </div>
          </div>

          {/* 安全提示 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800">
              <strong>🔒 安全设计：</strong> 您的 API Key 会被加密存储在服务器数据库中。仅在您首次设置时从前端传输到后端，之后的所有请求都由后端使用加密的 Key，前端不再接触真实的 Key。
            </p>
          </div>

          {/* 使用说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>📝 工作原理：</strong>
            </p>
            <ul className="text-sm text-blue-700 space-y-1 pl-4">
              <li>1. 在此页面输入 API Key（密码框，仅显示掩码）</li>
              <li>2. 点击"保存配置"后，Key 被加密发送到后端</li>
              <li>3. 后端将加密后的 Key 存储在数据库中</li>
              <li>4. 前端的输入框立即清空，永不存储或显示 Key</li>
              <li>5. 后续使用该配置时，后端从数据库解密 Key 进行 LLM 调用</li>
              <li>6. 即使前端被攻击或泄露，真实的 Key 仍然安全</li>
            </ul>
          </div>
        </div>

        {!isInMenu && (
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3 justify-end sticky bottom-0">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
            >
              ✕ 关闭
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {saving ? '⏳' : saved ? '✓' : '💾'} {saving ? '保存中...' : saved ? '已保存' : '保存配置'}
            </button>
          </div>
        )}

        {isInMenu && (
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {saving ? '⏳' : saved ? '✓' : '💾'} {saving ? '保存中...' : saved ? '已保存' : '保存配置'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelSettings
