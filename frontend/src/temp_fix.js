  const handleKeywordClick = async (keyword) => {
    setSelectedKeyword(keyword)

    // 检查是否已有保存的解释
    if (documentData?.savedExplanations?.[keyword]) {
      setExplanation(documentData.savedExplanations[keyword].explanation)
      setLoadingExplanation(false)
      return
    }

    // 否则调用 API 生成新的解释（使用流式）
    setExplanation('')
    setLoadingExplanation(true)

    try {
      await explainKeywordStream(keyword, '', (chunk) => {
        setExplanation(prev => prev + chunk)
      })
    } catch (error) {
      const errorMsg = '生成解释失败，请重试'
      setExplanation(errorMsg)
    } finally {
      setLoadingExplanation(false)
    }
  }
