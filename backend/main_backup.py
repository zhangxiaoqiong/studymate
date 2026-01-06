from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import os
from dotenv import load_dotenv
import tempfile
from pathlib import Path

load_dotenv()

app = FastAPI(title="Doc Explorer API")

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

class LLMConfigResponse(BaseModel):
    apiBase: str
    modelName: str
    temperature: float
    maxTokens: int

# ========== Routes ==========

@app.get("/")
async def root():
    return {"message": "Doc Explorer API is running"}

@app.post("/upload_document", response_model=dict)
async def upload_document(request: DocumentUploadRequest):
    """上传文档并提取关键词"""
    from services.keyword_extractor import KeywordExtractor

    extractor = KeywordExtractor()
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

    extractor = KeywordExtractor()
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

from services.db import init_db, get_active_config, get_all_configs, save_config, activate_config, delete_config, get_decrypted_config
from services.crypto import mask_api_key

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
                "apiBase": decrypted.get("apiBase", os.getenv("API_BASE_URL", "https://api.deepseek.com/v1")),
                "apiKey": decrypted.get("apiKey", os.getenv("DEEPSEEK_API_KEY", "")),
                "modelName": decrypted.get("modelName", os.getenv("LLM_MODEL", "deepseek-chat")),
                "temperature": decrypted.get("temperature", float(os.getenv("LLM_TEMPERATURE", "0.7"))),
                "maxTokens": decrypted.get("maxTokens", int(os.getenv("LLM_MAX_TOKENS", "1000"))),
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


@app.post("/llm_config")
async def set_llm_config(config: LLMConfigRequest):
    """保存完整的 LLM 配置（包含 API Key，加密存储）"""
    try:
        if not config.apiKey:
            raise HTTPException(status_code=400, detail="API Key 不能为空")

        print(f"API配置: 保存配置 '{config.configName}'...")

        # 保存到数据库（自动加密 API Key）
        success = save_config(
            config.configName,
            config.apiBase,
            config.apiKey,
            config.modelName,
            config.temperature,
            config.maxTokens,
            is_active=True
        )

        if not success:
            print(f"API配置: 保存失败")
            raise HTTPException(status_code=400, detail="保存配置失败")

        print(f"API配置: 保存成功，更新全局配置...")

        # 更新全局配置
        global llm_config
        llm_config = get_current_config()

        print(f"API配置: 返回成功响应")

        return {
            "message": "配置已更新",
            "configName": config.configName,
            "apiBase": config.apiBase,
            "modelName": config.modelName,
            "temperature": config.temperature,
            "maxTokens": config.maxTokens,
            "apiKeyMask": mask_api_key(config.apiKey),  # 仅返回掩码
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"API配置: 异常错误: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")


@app.post("/activate_config/{config_name}")
async def activate_config_endpoint(config_name: str):
    """激活一个配置"""
    success = activate_config(config_name)

    if not success:
        raise HTTPException(status_code=400, detail="激活配置失败")

    # 更新全局配置
    global llm_config
    llm_config = get_current_config()

    return {
        "message": f"已激活配置: {config_name}",
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
