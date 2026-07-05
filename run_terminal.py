# 尽量不使用外部库
import re
import json
import random
import sys
import threading
import time
import logging

# 配置日志级别为 INFO，并自定义输出格式
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logging.info("Application started")


FAKE_LOGS = [
    (logging.info, '127.0.0.1:{} - "GET /api/users HTTP/1.1" 200'),
    (logging.info, '127.0.0.1:{} - "GET /health HTTP/1.1" 200'),
    (logging.info, '127.0.0.1:{} - "POST /login HTTP/1.1" 200'),
    (logging.info, '127.0.0.1:{} - "GET /favicon.ico HTTP/1.1" 404'),
    (logging.warning, "Redis connection timeout, retrying..."),
    (logging.warning, "Slow SQL query detected."),
    (logging.warning, "Background task is delayed."),
    (logging.error, "JWT token expired."),
    (logging.error, "Permission denied: /admin"),
    (logging.info, "Cache refreshed."),
]

def background_logs(stop_event):
    while not stop_event.is_set():
        time.sleep(random.uniform(1,3))

        func,msg=random.choice(FAKE_LOGS)

        if "{}" in msg:
            msg=msg.format(random.randint(30000,65000))

        func(msg)


def load_js_array(filename):
    with open(filename, encoding="utf-8") as f:
        text = f.read()

    # 提取 = 后面的数组
    m = re.search(r'=\s*(\[.*\])\s*;?\s*$', text, re.S)
    if not m:
        raise ValueError("没有找到数组")

    array_text = m.group(1)

    # 给 key 加双引号
    array_text = re.sub(
        r'([,{]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)',
        r'\1"\2"\3',
        array_text
    )

    return json.loads(array_text)


def fake_cmd_content(first=False):
    if first:
        pid = random.randint(2000, 9000)
        logging.info(f"Started server process [{pid}]")
        logging.info("Waiting for application startup.")
        logging.info("Application startup complete.")
        logging.info("Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)")

    for _ in range(random.randint(2,5)):
        func, msg = random.choice(FAKE_LOGS)

        if "{}" in msg:
            port = random.randint(30000,65000)
            msg = msg.format(port)

        func(msg)


def get_user_input(prompt_text):
    # Create the visual alignment to match the log headers
    # The header is 15 chars + " | " (3 chars) = 18 chars padding
    padding = " " * 18
    
    # Use sys.stdout to print the prompt so it stays on the same line if needed
    sys.stdout.write(f"{padding}>> {prompt_text} ")
    sys.stdout.flush()
    
    return input()


fake_cmd_content()
with open("book_list.js", "r", encoding="utf-8") as f:
    text = f.read()

# 提取 [...] 部分
array_text = re.search(r'const\s+\w+\s*=\s*(\[.*\]);?', text, re.S).group(1)

# 给 key 加双引号
array_text = re.sub(r'([,{]\s*)([A-Za-z_]\w*)(\s*:)', r'\1"\2"\3', array_text)

book_list = json.loads(array_text)
for i, item in enumerate(book_list):
    logging.info(f"[{i}] {item['Path']}")

fake_cmd_content()
book_selected = None
while book_selected is None:
    user_input = input(">> ") 
    if user_input.isdigit():
        user_input = int(user_input)
        if user_input in range(len(book_list)):
            book_selected = user_input
            logging.info(f"{book_list[book_selected]['Path']}")


book_content_list = load_js_array(book_list[book_selected]['Path'])

unit_list = [item['Unit'] for item in book_content_list]
unit_list = list(set(unit_list))
unit_list.append("random")
for i, item in enumerate(unit_list):
    logging.info(f"[{i}] {item}")

fake_cmd_content()
unit_selected = None
while unit_selected is None:
    user_input = input(">> ") 
    if user_input.isdigit():
        user_input = int(user_input)
        if user_input in range(len(unit_list)):
            unit_selected = unit_list[user_input]

if unit_selected != 'random':
    unit_content = [item for item in book_content_list if item['Unit'] == unit_selected]
else:
    unit_content = random.choices(book_content_list, k=10)

for q_content in unit_content:
    time.sleep(0.2)
    logging.info("Received inference request.")
    time.sleep(0.2)
    logging.info("Loading prompt...")
    time.sleep(0.2)
    logging.info("Prompt loaded.")
    question = re.sub(r'\[([^\]]+)\]\{[^}]+\}', r'\1', q_content['Question'])
    logging.info(question)
    for i, item in enumerate(q_content["Option"], 1):
        if i == 1:
            prefix = random.randint(0, 9)
        elif i == 2:
            prefix = random.randint(10, 99)
        elif i == 3:
            prefix = random.randint(100, 999)
        else:
            prefix = random.randint(1000, 9999)

        suffix = random.randint(0, 999)
        logging.info(f"[id={prefix}.{suffix:03d}] {item}")
    fake_cmd_content()
    
    stop = threading.Event()

    t = threading.Thread(target=background_logs,args=(stop,),daemon=True)
    t.start()

    ans = get_user_input("POST /v1/answer")

    stop.set()
    
    ans = int(ans)
    elapsed = random.randint(20,80)
    time.sleep(1)
    logging.info(f"Response generated in {elapsed} ms.")
    if ans == q_content['Correct Answer']:
        logging.info("Request completed successfully.")
    else:
        logging.error("Traceback (most recent call last):")
        logging.error(
            f'  File "quiz.py", line {random.randint(0,4096)}, in <module>'
        )
        logging.error(
            f"ValueError: Expected {q_content['Correct Answer']}, got {ans}"
        )
    
    analysis = {'Analysis' : q_content['Analysis']}
    logging.info(f"{analysis}")

