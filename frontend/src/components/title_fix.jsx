        <div>
          {mode === 'saved' ? (
            <select
              value={selectedSavedKeyword || ''}
              onChange={(e) => setSelectedSavedKeyword(e.target.value)}
              className="text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            >
              {Object.keys(savedExplanations).map((kw) => (
                <option key={kw} value={kw}>
                  {kw}
                </option>
              ))}
            </select>
          ) : (
            <h2 className="text-xl font-bold text-gray-900">{displayKeyword}</h2>
          )}
          <p className="text-sm text-gray-600 mt-1">
            {mode === 'saved' ? '已保存的解释' : '详细解释'}
          </p>
        </div>
