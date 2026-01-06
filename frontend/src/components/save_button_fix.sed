250,260c
          {mode === 'new' ? (
            <button
              onClick={handleSaveClick}
              disabled={loading || !explanation}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-1"
              title="保存"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>保存</span>
            </button>
          ) : (
.
