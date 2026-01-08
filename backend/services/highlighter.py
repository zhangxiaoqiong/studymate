"""
关键词高亮服务

生成高亮信息（span），用于在前端对文本中的关键词进行标记和高亮显示。
"""
import re
from typing import List, Dict

class KeywordHighlighter:
    """生成高亮数据（span 信息），用于前端高亮显示"""

    def generate_spans(self, text: str, keywords: List[Dict]) -> List[Dict]:
        """
        基于文本和关键词列表，生成高亮信息

        Args:
            text: 原文本内容
            keywords: 关键词列表，每项包含 keyword、snippet、category 字段

        Returns:
            list: 高亮数据，格式为 [{"keyword": "...", "start": 0, "end": 10}, ...]
        """
        spans = []
        found_keywords = set()  # 已经找到的关键词

        # 按 snippet 长度倒序排列（优先使用更具体的 snippet）
        sorted_keywords = sorted(
            keywords,
            key=lambda kw: len(kw.get("snippet", "")),
            reverse=True
        )

        for kw_item in sorted_keywords:
            keyword = kw_item.get("keyword", "").strip()
            snippet = kw_item.get("snippet", "").strip()

            if not keyword or keyword in found_keywords:
                continue

            # 首先尝试在 snippet 中定位关键词
            if snippet and snippet in text:
                # 在 snippet 出现的位置中找到关键词
                snippet_pos = text.find(snippet)
                if snippet_pos != -1:
                    # 在 snippet 内查找关键词的位置
                    keyword_pos_in_snippet = snippet.find(keyword)
                    if keyword_pos_in_snippet != -1:
                        # 计算在原文中的绝对位置
                        start = snippet_pos + keyword_pos_in_snippet
                        end = start + len(keyword)
                        spans.append({
                            "keyword": keyword,
                            "start": start,
                            "end": end
                        })
                        found_keywords.add(keyword)
                        continue

            # 如果 snippet 不在文本中，直接在文本中查找关键词
            # 使用正则查找所有位置
            pattern = re.escape(keyword)
            matches = list(re.finditer(pattern, text))

            if matches and keyword not in found_keywords:
                # 只记录第一个匹配位置
                match = matches[0]
                spans.append({
                    "keyword": keyword,
                    "start": match.start(),
                    "end": match.end()
                })
                found_keywords.add(keyword)

        # 按 start 位置排序（便于前端渲染）
        spans.sort(key=lambda x: x["start"])

        return spans
