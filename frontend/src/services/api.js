import axios from 'axios'

// 使用 '/api' 来利用 Vite 的代理功能，在生产环境中设置正确的 URL
const API_BASE_URL = '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
})

export const extractKeywords = async (text, title = 'Untitled') => {
  try {
    const response = await api.post('/extract_keywords', { text, title })
    return response.data
  } catch (error) {
    console.error('Failed to extract keywords:', error)
    throw error
  }
}

export const explainKeyword = async (keyword, context = '') => {
  try {
    const response = await api.post('/explain_keyword', { keyword, context })
    return response.data
  } catch (error) {
    console.error('Failed to explain keyword:', error)
    throw error
  }
}

// 流式解释关键词
export const explainKeywordStream = async (keyword, context = '', onChunk) => {
  try {
    const response = await fetch(`${API_BASE_URL}/explain_keyword_stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ keyword, context })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      fullText += chunk
      if (onChunk) onChunk(chunk)
    }

    return { keyword, explanation: fullText }
  } catch (error) {
    console.error('Failed to explain keyword (stream):', error)
    throw error
  }
}

export const askFollowupQuestion = async (keyword, explanation, question) => {
  try {
    const response = await api.post('/followup_question', { keyword, explanation, question })
    return response.data
  } catch (error) {
    console.error('Failed to ask followup question:', error)
    throw error
  }
}

// 流式问答
export const askFollowupQuestionStream = async (keyword, explanation, question, onChunk) => {
  try {
    const response = await fetch(`${API_BASE_URL}/followup_question_stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ keyword, explanation, question })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      fullText += chunk
      if (onChunk) onChunk(chunk)
    }

    return { answer: fullText }
  } catch (error) {
    console.error('Failed to ask followup question (stream):', error)
    throw error
  }
}
