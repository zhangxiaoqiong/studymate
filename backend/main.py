"""
StudyMate Backend API - Doc Explorer

主要功能：
1. 文档管理：上传、解析文本和文件
2. 关键词提取：使用 LLM 智能提取文档关键词
3. 解释生成：为关键词生成详细解释（流式或非流式）
4. 大模型配置：支持多个 LLM 配置（DeepSeek、OpenAI 等），持久化存储
5. API 测试：测试 LLM 配置是否可用

架构：
- FastAPI 框架
- SQLite 数据库（LLM 配置）
- 加密存储敏感信息（API Key）
- 异步操作支持（async/await）

环境变量：
- API_BASE_URL: LLM API 基础 URL（默认 DeepSeek）
- DEEPSEEK_API_KEY: LLM API 密钥
- LLM_MODEL: 模型名称
- LLM_TEMPERATURE: 温度参数
- LLM_MAX_TOKENS: 最大令牌数
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
import tempfile
from pathlib import Path
import httpx
import asyncio

load_dotenv()

app = FastAPI(title="StudyMate API", description="智能学习助手 - AI 驱动的知识探索平台")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== Models ==========

class DocumentUploadRequest(BaseModel):
    text: str
    title: str = "Untitled"

class KeywordExplainRequest(BaseModel):
    keyword: str
    context: str = ""

class Span(BaseModel):
    keyword: str
    start: int
    end: int

class DocumentResponse(BaseModel):
    text: str
    title: str
    keywords: List[Dict]
    spans: List[Span]

class ExplainResponse(BaseModel):
    keyword: str
    explanation: str

class ExplanationFollowupRequest(BaseModel):
    keyword: str
    explanation: str
    question: str

class ExplanationFollowupResponse(BaseModel):
    answer: str

class UserConfigRequest(BaseModel):
    configName: str
    apiBase: str
    modelName: str
    temperature: float = 0.7
    maxTokens: int = 1000

class LLMConfigRequest(BaseModel):
    configName: str
    apiBase: str
    apiKey: str
    modelName: str
    temperature: float = 0.7
    maxTokens: int = 1000
    editingConfigName: Optional[str] = None  # 编辑时的原始配置名称，用于判断是否是编辑模式

class LLMConfigResponse(BaseModel):
    apiBase: str
    modelName: str
    temperature: float
    maxTokens: int

class TestLLMConfigRequest(BaseModel):
    apiBase: str
    modelName: str
    apiKey: str

# ========== Routes ==========

@app.get("/")
async def root():
    return {"message": "Doc Explorer API is running"}

@app.post("/upload_document", response_model=dict)
async def upload_document(request: DocumentUploadRequest):
    """上传文档并提取关键词"""
    from services.keyword_extractor import KeywordExtractor

    extractor = KeywordExtractor(config=llm_config)
    keywords = await extractor.extract(request.text)

    return {
        "text": request.text,
        "title": request.title,
        "keywords": keywords,
        "status": "success"
    }

@app.post("/extract_keywords", response_model=dict)
async def extract_keywords(request: DocumentUploadRequest):
    """提取关键词并生成高亮数据"""
    from services.keyword_extractor import KeywordExtractor
    from services.highlighter import KeywordHighlighter

    extractor = KeywordExtractor(config=llm_config)
    keywords = await extractor.extract(request.text)

    highlighter = KeywordHighlighter()
    spans = highlighter.generate_spans(request.text, keywords)

    return {
        "text": request.text,
        "keywords": keywords,
        "spans": spans
    }

@app.post("/explain_keyword", response_model=ExplainResponse)
async def explain_keyword(request: KeywordExplainRequest):
    """生成关键词的详细解释"""
    from services.explainer import KeywordExplainer

    explainer = KeywordExplainer(config=llm_config)
    explanation = await explainer.explain(request.keyword, request.context)

    return {
        "keyword": request.keyword,
        "explanation": explanation
    }


@app.post("/explain_keyword_stream")
async def explain_keyword_stream(request: KeywordExplainRequest):
    """生成关键词的详细解释（流式）"""
    from services.explainer import KeywordExplainer

    explainer = KeywordExplainer(config=llm_config)
    
    async def generate():
        async for chunk in explainer.explain_stream(request.keyword, request.context):
            yield chunk

    return StreamingResponse(generate(), media_type="text/plain")


@app.post("/followup_question_stream")
async def followup_question_stream(request: ExplanationFollowupRequest):
    """对已有的解释进行后续提问（流式）"""
    from services.explainer import KeywordExplainer

    explainer = KeywordExplainer(config=llm_config)
    
    async def generate():
        async for chunk in explainer.answer_followup_stream(
            request.keyword,
            request.explanation,
            request.question
        ):
            yield chunk

    return StreamingResponse(generate(), media_type="text/plain")

@app.post("/followup_question", response_model=ExplanationFollowupResponse)
async def followup_question(request: ExplanationFollowupRequest):
    """对已有的解释进行后续提问"""
    from services.explainer import KeywordExplainer

    explainer = KeywordExplainer(config=llm_config)
    answer = await explainer.answer_followup(
        request.keyword,
        request.explanation,
        request.question
    )

    return {
        "answer": answer
    }

@app.post("/upload_file")
async def upload_file(file: UploadFile = File(...)):
    """上传文件并提取文本内容"""
    from services.file_parser import FileParser

    try:
        # 验证文件名
        if not file.filename:
            raise HTTPException(status_code=400, detail="文件名不能为空")

        # 读取文件到临时位置
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # 验证文件
            is_valid, error_msg = FileParser.validate_file(tmp_path, len(content))
            if not is_valid:
                raise HTTPException(status_code=400, detail=error_msg)

            # 解析文件
            text = FileParser.parse_file(tmp_path)

            if not text:
                raise HTTPException(status_code=400, detail="文件内容为空")

            # 获取文件标题（不含后缀）
            title = Path(file.filename).stem

            return {
                "success": True,
                "text": text,
                "title": title,
                "message": f"成功提取 {len(text)} 个字符"
            }
        finally:
            # 删除临时文件
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")

# ========== 配置管理 ==========

from services.db import init_db, get_active_config, get_all_configs, save_config, activate_config, activate_config_by_id, delete_config, get_decrypted_config, get_config_by_name

# 初始化数据库
init_db()

# 启动时尝试加载活跃配置，如果没有则使用环境变量
def get_current_config():
    """获取当前活跃配置，如果没有则使用环境变量"""
    # 首先尝试从数据库获取活跃配置
    active = get_active_config()

    if active:
        decrypted = get_decrypted_config(active['config_name'])
        if decrypted:
            return {
                "apiBase": decrypted.get("api_base") or decrypted.get("apiBase") or os.getenv("API_BASE_URL", "https://api.deepseek.com/v1"),
                "apiKey": decrypted.get("api_key") or decrypted.get("apiKey") or os.getenv("DEEPSEEK_API_KEY", ""),
                "modelName": decrypted.get("model_name") or decrypted.get("modelName") or os.getenv("LLM_MODEL", "deepseek-chat"),
                "temperature": float(decrypted.get("temperature") or os.getenv("LLM_TEMPERATURE", "0.7")),
                "maxTokens": int(decrypted.get("max_tokens") or os.getenv("LLM_MAX_TOKENS", "1000")),
            }

    # 如果没有活跃配置，使用环境变量
    return {
        "apiBase": os.getenv("API_BASE_URL", "https://api.deepseek.com/v1"),
        "apiKey": os.getenv("DEEPSEEK_API_KEY", ""),
        "modelName": os.getenv("LLM_MODEL", "deepseek-chat"),
        "temperature": float(os.getenv("LLM_TEMPERATURE", "0.7")),
        "maxTokens": int(os.getenv("LLM_MAX_TOKENS", "1000")),
    }


# 全局配置变量（实时更新）
llm_config = get_current_config()


@app.post("/user_config")
async def set_user_config(config: UserConfigRequest):
    """保存用户配置参数（不含 API Key）"""
    # 获取活跃配置的 API Key
    active = get_active_config()
    api_key = ""

    if active:
        decrypted = get_decrypted_config(active['config_name'])
        if decrypted:
            api_key = decrypted.get('apiKey', '')

    # 保存配置（包含已存在的 API Key）
    success = save_config(
        config.configName,
        config.apiBase,
        api_key,  # 保留现有 API Key
        config.modelName,
        config.temperature,
        config.maxTokens,
        is_active=True
    )

    if not success:
        raise HTTPException(status_code=400, detail="保存配置失败")

    # 更新全局配置
    global llm_config
    llm_config = get_current_config()

    return {
        "message": "配置已更新",
        "configName": config.configName,
    }


@app.get("/user_config")
async def get_user_config():
    """获取所有用户配置（不含 API Key）"""
    configs = get_all_configs()
    return {
        "configs": configs,
    }


@app.get("/llm_config/{config_name}")
async def get_llm_config_detail(config_name: str):
    """获取单个配置的完整信息（包括解密的 API Key）"""
    config = get_decrypted_config(config_name)
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")

    return {
        "configName": config_name,
        "apiBase": config.get('api_base') or config.get('apiBase'),
        "apiKey": config.get('api_key') or config.get('apiKey'),
        "modelName": config.get('model_name') or config.get('modelName'),
        "temperature": config.get('temperature', 0.7),
        "maxTokens": config.get('max_tokens', 1000),
    }


@app.get("/llm_config_by_id/{config_id}")
async def get_llm_config_by_id(config_id: int):
    """按 ID 获取配置的完整信息（不包含 API Key，安全起见）"""
    from services.db import get_config_by_id
    config = get_config_by_id(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")

    return {
        "configName": config.get('config_name'),
        "apiBase": config.get('api_base'),
        "modelName": config.get('model_name'),
        "temperature": config.get('temperature', 0.7),
        "maxTokens": config.get('max_tokens', 1000),
        # 注意：故意不返回 API Key，以保护安全
    }


@app.post("/llm_config")
async def set_llm_config(config: LLMConfigRequest):
    """保存完整的 LLM 配置（包含 API Key，加密存储）

    处理新建和编辑两种模式：
    - 新建：API Key 必须提供，自动激活
    - 编辑：API Key 可选（为空时使用现有的），保持原激活状态
    """
    try:
        # 确定 API Key（新建必须提供，编辑可使用现有）
        api_key = config.apiKey
        if config.editingConfigName and not api_key:
            # 编辑模式下如果未提供 API Key，使用现有的
            existing = get_decrypted_config(config.editingConfigName)
            if existing:
                api_key = existing.get('api_key')
            if not api_key:
                raise HTTPException(status_code=400, detail="无法找到原有 API Key，请提供新的 API Key")

        if not api_key:
            raise HTTPException(status_code=400, detail="API Key 不能为空")

        # 自动激活新配置，编辑时保持原状态
        is_active = not config.editingConfigName

        # 编辑时如果配置名称改变，需删除旧配置
        if config.editingConfigName and config.editingConfigName != config.configName:
            delete_config(config.editingConfigName)

        # 保存到数据库（自动加密 API Key）
        success, config_id = save_config(
            config.configName,
            config.apiBase,
            api_key,
            config.modelName,
            config.temperature,
            config.maxTokens,
            is_active=is_active
        )

        if not success:
            raise HTTPException(status_code=400, detail="保存配置失败")

        # 更新全局配置
        global llm_config
        llm_config = get_current_config()

        return {
            "message": "配置已更新",
            "configName": config.configName,
            "configId": config_id,
            "apiBase": config.apiBase,
            "modelName": config.modelName,
            "temperature": config.temperature,
            "maxTokens": config.maxTokens,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")


@app.post("/activate_config/{config_name}")
async def activate_config_endpoint(config_name: str):
    """激活一个配置（按名称，已弃用，推荐使用按ID的版本）"""
    existing = get_config_by_name(config_name)
    if not existing:
        raise HTTPException(status_code=404, detail=f"配置'{config_name}'不存在")

    success = activate_config(config_name)
    if not success:
        raise HTTPException(status_code=400, detail="激活配置失败")

    # 更新全局配置
    global llm_config
    llm_config = get_current_config()

    return {
        "message": f"已激活配置: {config_name}",
    }


@app.post("/activate_config_by_id/{config_id}")
async def activate_config_by_id_endpoint(config_id: int):
    """按 ID 激活一个配置（推荐方式，避免 URL 编码问题）"""
    success = activate_config_by_id(config_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"配置 ID {config_id} 不存在或激活失败")

    # 更新全局配置
    global llm_config
    llm_config = get_current_config()

    return {
        "message": f"已激活配置: ID {config_id}",
    }


@app.delete("/llm_config/{config_name}")
async def delete_llm_config(config_name: str):
    """删除一个配置"""
    success = delete_config(config_name)

    if not success:
        raise HTTPException(status_code=400, detail="删除配置失败")

    return {
        "message": f"已删除配置: {config_name}",
    }


@app.get("/llm_config")
async def get_llm_config_endpoint():
    """获取当前活跃配置的非敏感信息"""
    config = get_current_config()
    return {
        "apiBase": config["apiBase"],
        "modelName": config["modelName"],
        "temperature": config["temperature"],
        "maxTokens": config["maxTokens"],
    }


def get_current_llm_config():
    """获取当前的大模型配置（内部使用）"""
    global llm_config
    return llm_config


async def _test_llm_api(api_base: str, model_name: str, api_key: str):
    """
    测试 LLM API 连接（内部辅助方法）

    Args:
        api_base: API 基础 URL（如 https://api.deepseek.com/v1）
        model_name: 模型名称
        api_key: API 密钥

    Returns:
        dict: {"success": bool, "message": str}
    """
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": [{"role": "user", "content": "test"}],
            "max_tokens": 10
        }

        api_url = f"{api_base.rstrip('/')}/chat/completions"

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(api_url, json=payload, headers=headers)

            if response.status_code == 200:
                return {"success": True, "message": "✅ 连接成功，API 密钥有效"}

            # 解析错误信息
            error_detail = "API 返回错误"
            try:
                error_data = response.json()
                if "error" in error_data:
                    error_detail = error_data["error"].get("message", str(error_data))
                else:
                    error_detail = str(error_data)
            except:
                error_detail = response.text[:200]

            return {"success": False, "message": f"❌ API 错误 ({response.status_code}): {error_detail}"}

    except asyncio.TimeoutError:
        return {"success": False, "message": "❌ 连接超时（15秒），请检查 API 地址是否正确"}
    except Exception as e:
        return {"success": False, "message": f"❌ 连接失败: {str(e)}"}


@app.post("/test_llm_config")
async def test_llm_config(request: TestLLMConfigRequest):
    """测试 LLM 配置是否可用（使用前端提供的 API Key）"""
    return await _test_llm_api(request.apiBase, request.modelName, request.apiKey)


@app.post("/test_existing_llm_config/{config_id}")
async def test_existing_llm_config(config_id: int):
    """测试现有配置的 API Key（编辑时使用，不需要前端提供 API Key）"""
    from services.db import get_config_by_id

    config = get_config_by_id(config_id)
    if not config:
        return {"success": False, "message": "❌ 配置不存在"}

    # 解密 API Key
    decrypted = get_decrypted_config(config['config_name'])
    if not decrypted or not decrypted.get('api_key'):
        return {"success": False, "message": "❌ 无法获取 API Key"}

    return await _test_llm_api(
        config.get('api_base', ''),
        config.get('model_name'),
        decrypted['api_key']
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
