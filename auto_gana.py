# Offline script(Python environment required)
# pip install pykakasi
import pykakasi
import os

# 初始化 pykakasi 用于日语文本转换
kks = pykakasi.kakasi()


def process_jp_sentence(text):
    """
    对一段日语句子添加假名（振假名）。
    如果句子中已经包含了注释标记 {}，则跳过不处理。

    参数:
        text (str): 原始日语句子

    返回:
        str: 添加了假名注释的句子
    """
    # Skip processed sentence
    if '{' in text:
        return text

    result = kks.convert(text)

    annotated_text = ''
    for item in result:
        if item['orig'] != item['hira']:
            annotated_text += f"[{item['orig']}]" + "{" + f"{item['hira']}" + "}"
        else:
            # 假名或无需注释的部分保持原样
            annotated_text += item['orig']

    return annotated_text


def test():
    text = "彼は東京大学で勉強している。"
    annotated_text = process_jp_sentence(text)
    print(annotated_text)
    text = "彼は[東京大学]{とうきょうだいがく}で勉強している。"
    annotated_text = process_jp_sentence(text)
    print(annotated_text)


def process_file(fname):
    """
    主函数：
    读取 JS 文件中的题干行（包含 "Question" 关键字），
    对其中的日语句子进行假名注释，并写入新文件。
    最后将临时文件替换原文件。
    """
    with open(f"{fname}.js", 'r', encoding='utf-8') as f:
        content = f.readlines()

    with open(f"{fname}_temp.js", 'w+', encoding='utf-8') as f:
        for line in content:
            if "Question" in line:
                question = line.split('"')[3]
                annotated_question = process_jp_sentence(question)
                f.write(f"      \"Question\": \"{annotated_question}\",\n")
            else:
                f.write(line)

    # 替换原文件
    os.replace(f"{fname}_temp.js", f"{fname}.js")
   # os.remove("BlueBook_N3_temp.js")


def main():
    process_file("BlueBook_N3")
    process_file("Simulate_N3")
    process_file("JLPT_Test")
    process_file("IT_PASSPORT_OFFICIAL")


main()
