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
            keywords: 关键词列表，每项包含 keyword 字段

        Returns:
            list: 高亮数据，格式为 [{"keyword": "...", "start": 0, "end": 10}, ...]
        """
        spans = []
        found_keywords = set()  # 已经找到的关键词

        # 按关键词长度倒序排列（优先匹配较长的关键词，避免被短词覆盖）
        sorted_keywords = sorted(
            keywords,
            key=lambda kw: len(kw.get("keyword", "")),
            reverse=True
        )

        for kw_item in sorted_keywords:
            keyword = kw_item.get("keyword", "").strip()

            if not keyword or keyword in found_keywords:
                continue

            # 在文本中查找关键词
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

