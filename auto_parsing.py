import re
import json
import textwrap

answer_trans_dict = {"ア": 1, "イ": 2, "ウ": 3, "エ": 4}


# Split option text to list format
def split_by_kana(s):
    # 手动处理一下特殊情况
    if s.startswith("[OptionLine]"):
        return [s[len("[OptionLine]"):]]

    return [item.lstrip() for item in re.split(r'[アイウエ]', s)[1:]]


def remove_question_number(s):
    # 匹配 "問" + 任意数字 + 空格（可选），并替换为空
    return re.sub(r'^問\d+\s*', '', s)


def problem_parsing(problem_path, answer_path, out_path, out_name, unit):
    with open(problem_path, 'r', encoding='utf-8') as f:
        problem_ori = f.readlines()

    with open(answer_path, 'r', encoding='utf-8') as f:
        answers = []
        for line in f.readlines():
            text = line.strip()
            if text in answer_trans_dict.keys():
                answers.append(answer_trans_dict[text])
            else:
                print("Unknown answer:", text)
                return

    current_index = 0    # Index of question
    option_exist = False    # Stage 2: parsing options
    problems_list = []
    problem_info = None  # Problem info dict
    for line in problem_ori:
        # Every question should be start with "問"
        if line.startswith("問"):
            if problem_info is not None:
                if len(problem_info["Option"]) != 4:
                    print(f"[{current_index}]Abnormal option number:", len(problem_info["Option"]))
                problems_list.append(problem_info)
            problem_info = {
                "Question": remove_question_number(line),
                "Option": [],
                "Unit": unit,
                "Correct Answer": answers[current_index]}
            current_index += 1
            option_exist = False
        # The question part and the option part should be split with empty line
        elif not option_exist and line == '\n':
            option_exist = True
        elif option_exist and line != '\n':
            problem_info["Option"].extend(split_by_kana(line.strip()))
        # Store question part
        else:
            problem_info["Question"] += line
    else:
        if problem_info is not None:
            problems_list.append(problem_info)

    with open(out_path, 'w+', encoding='utf-8') as f:
        print(f"{out_name} = [", file=f)
        for problem in problems_list[:-1]:
            json_str = json.dumps(problem, ensure_ascii=False, indent=4)
            indented_json = textwrap.indent(json_str, '  ')
            print(indented_json, ',', file=f, sep='\t')
        json_str = json.dumps(problems_list[-1], ensure_ascii=False, indent=4)
        indented_json = textwrap.indent(json_str, '  ')
        print(indented_json, file=f)
        print(f"]", file=f)



problem_parsing("input_data/question1.txt", "input_data/answer.txt",
                "IT_PASSPORT_OFFICIAL.js", "IT_PASSPORT_OFFICIAL", 2025)
