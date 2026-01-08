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
        # 按关键词长度倒序排列（长词优先，防止短词嵌套替换）
        sorted_keywords = sorted(
            [kw["keyword"] for kw in keywords],
            key=len,
            reverse=True
        )

        spans = []

        for keyword in sorted_keywords:
            # 使用正则查找所有位置
            # re.escape 防止特殊字符的影响
            pattern = re.escape(keyword)

            for match in re.finditer(pattern, text):
                span = {
                    "keyword": keyword,
                    "start": match.start(),
                    "end": match.end()
                }
                spans.append(span)

        # 按 start 位置排序（便于前端渲染）
        spans.sort(key=lambda x: x["start"])

        return spans
