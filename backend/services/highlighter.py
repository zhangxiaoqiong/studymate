import re
from typing import List, Dict

class KeywordHighlighter:
    """生成高亮数据（span信息）"""

    def generate_spans(self, text: str, keywords: List[Dict]) -> List[Dict]:
        """
        基于文本和关键词列表，生成高亮信息
        返回: [{"keyword": "...", "start": 0, "end": 10}, ...]
        """

        # 按关键词长度倒序排列（长词优先，防止嵌套替换）
        sorted_keywords = sorted(
            [kw["keyword"] for kw in keywords],
            key=len,
            reverse=True
        )

        spans = []

        for keyword in sorted_keywords:
            # 使用正则查找所有位置
            # re.escape防止特殊字符的影响
            pattern = re.escape(keyword)

            for match in re.finditer(pattern, text):
                span = {
                    "keyword": keyword,
                    "start": match.start(),
                    "end": match.end()
                }
                spans.append(span)

        # 按start位置排序（便于前端渲染）
        spans.sort(key=lambda x: x["start"])

        return spans
