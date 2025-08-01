# Offline script(Python environment required)
# pip install pykakasi
import pykakasi
import os
import jsonfiler

kana_description_dict = jsonfiler.load("translate_dict.json")

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
        if item['orig'] != item['hira'] and len(item['orig'])>1:
            description = item['hira']

            # 根据字典解析一些常见片假名
            if item['orig'] == item['kana']:
                if item['kana'] in kana_description_dict:
                    description = kana_description_dict[item['kana']]
                else:
                    print(item['kana'])

            annotated_text += f"[{item['orig']}]" + "{" + f"{description}" + "}"
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
    text = "4月1日から5月31日までに、取引①から取引⑤があった。各取引の受注、売上計上,現金回収の状況が表のとおりであるとき、この取引先に対する5月31日時点の売掛金は何万円か。ここで、4月1日時点で売掛金残高はないものとする。\n<table border=\"1\" style=\"width: 100%; table-layout: fixed;\">\n<thead>\n  <tr>\n    <th style=\"width: 15%;\">取引</th>\n    <th style=\"width: 15%;\">日付</th>\n    <th style=\"width: 20%;\">取引内訳</th>\n    <th style=\"width: 20%;\">金額(万円)</th>\n    <th style=\"width: 30%;\">備考</th>\n  </tr>\n</thead>\n<tbody>\n  <tr>\n    <td style=\"width: 15%; text-align: center;\">取引1</td>\n    <td style=\"width: 15%;\">4月2日<br>4月10日<br>4月30日</td>\n    <td style=\"width: 20%;\">受注<br>売上計上<br>現金回收</td>\n    <td style=\"width: 20%; text-align: right;\">800<br>800<br>800</td>\n    <td style=\"width: 30%;\"></td>\n  </tr>\n  <tr>\n    <td style=\"width: 15%; text-align: center;\">取引2</td>\n    <td style=\"width: 15%;\">4月5日<br>4月15日<br>4月30日</td>\n    <td style=\"width: 20%;\">受注<br>売上計上<br>現金回收</td>\n    <td style=\"width: 20%; text-align: right;\">500<br>500<br>500</td>\n    <td style=\"width: 30%;\"></td>\n  </tr>\n  <tr>\n    <td style=\"width: 15%; text-align: center;\">取引3</td>\n    <td style=\"width: 15%;\">5月1日<br>5月10日</td>\n    <td style=\"width: 20%;\">受注<br>売上計上</td>\n    <td style=\"width: 20%; text-align: right;\">1300<br>1300</td>\n    <td style=\"width: 30%;\">6月30日<br>回収予定</td>\n  </tr>\n  <tr>\n    <td style=\"width: 15%; text-align: center;\">取引4</td>\n    <td style=\"width: 15%;\">5月6日<br>5月15日</td>\n    <td style=\"width: 20%;\">受注<br>売上計上</td>\n    <td style=\"width: 20%; text-align: right;\">1000<br>1000</td>\n    <td style=\"width: 30%;\">回収予定日未定</td>\n  </tr>\n  <tr>\n    <td style=\"width: 15%; text-align: center;\">取引5</td>\n    <td style=\"width: 15%;\">5月20日</td>\n    <td style=\"width: 20%;\">受注</td>\n    <td style=\"width: 20%; text-align: right;\">400</td>\n    <td style=\"width: 30%;\"></td>\n  </tr>\n</tbody>\n</table>\n"
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
                if len(line.split('"')) > 5:
                    question = '"'.join(line.split('"')[3:-1])
                else:
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
