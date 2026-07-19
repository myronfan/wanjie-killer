import os
import json
from datetime import datetime, timedelta
from flask import Flask, render_template, request

from compress import frames_per_step, file_movement
from start import personas
import time as _time

app = Flask(
    __name__,
    template_folder="frontend/templates",
    static_folder="frontend/static",
    static_url_path="/static",
)


@app.route("/", methods=['GET'])
def index():
    name = request.args.get("name", "")          # 记录名称
    step = int(request.args.get("step", 0))      # 回放起始步数
    speed = int(request.args.get("speed", 2))    # 回放速度（0~5）
    zoom = float(request.args.get("zoom", 0.8))  # 画面缩放比例

    if len(name) > 0:
        compressed_folder = f"results/compressed/{name}"
    else:
        return f"Invalid name of the simulation: '{name}'"

    # 确保目录存在（防止前端 race condition）
    os.makedirs(compressed_folder, exist_ok=True)
    replay_file = f"{compressed_folder}/{file_movement}"
    if not os.path.exists(replay_file):
        # 返回友好的等待页面，不是冷冰冰 404。用户感觉更友好。
        return (
            f"<html><head><meta charset='utf-8'><meta http-equiv='refresh' content='5'>"
            f"<title>等待AI数据...</title><style>"
            f"body{{font-family:sans-serif;text-align:center;padding:60px;background:#1a1a1a;color:#fff}}"
            f"h1{{color:#5a9}}h2{{color:#888;font-weight:normal}}"
            f".spinner{{display:inline-block;width:40px;height:40px;border:4px solid #333;"
            f"border-top-color:#5a9;border-radius:50%;animation:spin 1s linear infinite}}"
            f"@keyframes spin{{to{{transform:rotate(360deg)}}}}</style></head><body>"
            f"<div class='spinner'></div>"
            f"<h1>⏳ 正在生成第一个 step 数据...</h1>"
            f"<h2>当前 simulation: <code>{name}</code></h2>"
            f"<p style='color:#888'>LLM 正在决策 3 个 AI 角色的第一个动作（首次约 3-5 分钟）<br>"
            f"此页面会在 5 秒后自动刷新。</p></body></html>"
        )

    with open(replay_file, "r", encoding="utf-8") as f:
        params = json.load(f)

    if step < 1:
        step = 1
    if step > 1:
        # 重新设置回放的起始时间
        t = datetime.fromisoformat(params["start_datetime"])
        dt = t + timedelta(minutes=params["stride"]*(step-1))
        params["start_datetime"] = dt.isoformat()
        step = (step-1) * frames_per_step + 1
        if step >= len(params["all_movement"]):
            step = len(params["all_movement"])-1

        # 重新设置Agent的初始位置
        for agent in params["persona_init_pos"].keys():
            persona_init_pos = params["persona_init_pos"]
            persona_step_pos = params["all_movement"][f"{step}"]
            persona_init_pos[agent] = persona_step_pos[agent]["movement"]

    if speed < 0:
        speed = 0
    elif speed > 5:
        speed = 5
    speed = 2 ** speed

    return render_template(
        "index.html",
        persona_names=personas,
        step=step,
        play_speed=speed,
        zoom=zoom,
        **params
    )


@app.route("/api/status.json", methods=["GET"])
def api_status():
    name = request.args.get("name", "")
    if not name:
        return {"error": "missing name"}, 400
    replay_file = f"results/compressed/{name}/{file_movement}"
    if not os.path.exists(replay_file):
        return {"error": "no_data", "name": name, "has_data": False}, 404
    stat = os.stat(replay_file)
    return {
        "name": name,
        "has_data": True,
        "mtime": stat.st_mtime,
        "mtime_iso": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "size": stat.st_size,
    }


@app.route("/api/health", methods=["GET"])
def api_health():
    return {"status": "ok", "server_time": _time.time(), "iso": datetime.now().isoformat()}


@app.route("/api/stream", methods=["GET"])
def api_stream():
    """SSE 流式推送 — 当 movement.json 更新时向客户端推送最新 step。

    真实时模式核心：让前端永远收到最新 LLM 决策，不用 reload、polling 到时间。
    """
    from flask import Response, stream_with_context
    import time as _time_sse

    name = request.args.get("name", "")
    if not name:
        return {"error": "missing name"}, 400

    replay_file = f"results/compressed/{name}/{file_movement}"
    if not os.path.exists(replay_file):
        os.makedirs(os.path.dirname(replay_file), exist_ok=True)

    last_mtime = 0

    def generate():
        nonlocal last_mtime
        # 首次：把当前已存在数据全推一次（如果有）
        try:
            if os.path.exists(replay_file):
                stat = os.stat(replay_file)
                last_mtime = stat.st_mtime
                with open(replay_file, "r", encoding="utf-8") as f:
                    params = json.load(f)
                am = params.get("all_movement", {})
                ks = [k for k in am.keys() if k not in ("description", "conversation") and k.isdigit()]
                ks.sort(key=lambda x: int(x))
                latest = {"type": "init", "steps": ks, "movement": am if ks else {}}
                yield f"data: {json.dumps(latest, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)}, ensure_ascii=False)}\n\n"

        last_step_key = None
        while True:
            try:
                if os.path.exists(replay_file):
                    stat = os.stat(replay_file)
                    if stat.st_mtime > last_mtime:
                        last_mtime = stat.st_mtime
                        with open(replay_file, "r", encoding="utf-8") as f:
                            params = json.load(f)
                        am = params.get("all_movement", {})
                        ks = [k for k in am.keys() if k not in ("description", "conversation") and k.isdigit()]
                        ks.sort(key=lambda x: int(x))
                        if ks:
                            cur = ks[-1]
                            if cur != last_step_key:
                                last_step_key = cur
                                # 只推最新 step 的 frame（不推所有历史）
                                latest = {"type": "step", "step": cur, "movement": am[cur]}
                                yield f"data: {json.dumps(latest, ensure_ascii=False)}\n\n"
                _time_sse.sleep(2)
            except Exception:
                _time_sse.sleep(5)

    return Response(stream_with_context(generate()), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"})


@app.route("/api/latest_step.json", methods=["GET"])
def api_latest_step():
    """返回最新的 movement step，LIVE 模式前端用：
       - 返回当前 movement.json 的最大 key 和对应 frame
       - 让 Phaser 知道 agent 的最新 LLM 决策位置（不再依赖 60 帧锁定）
    """
    name = request.args.get("name", "")
    if not name:
        return {"error": "missing name"}, 400
    replay_file = f"results/compressed/{name}/{file_movement}"
    if not os.path.exists(replay_file):
        return {"error": "no_data", "name": name, "steps": [], "movement": {}}, 200
    try:
        with open(replay_file, "r", encoding="utf-8") as f:
            params = json.load(f)
        all_movement = params.get("all_movement", {})
        # 排除描述和对话字段
        step_keys = [k for k in all_movement.keys() if k not in ("description", "conversation") and k.isdigit()]
        step_keys.sort(key=lambda x: int(x))
        latest = {"steps": step_keys, "movement": all_movement, "latest_key": step_keys[-1] if step_keys else None}
        return latest
    except Exception as e:
        return {"error": str(e)}, 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
