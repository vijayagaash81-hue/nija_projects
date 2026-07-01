import re
import sys

with open("sl_njt_projsumrep.js", "r", encoding="utf-8") as f:
    content = f.read()

# Extract the script block content inside '<script>' + ... + '</script>'
match = re.search(r"html\s*\+=\s*'<script>'(.*?)\n\s*'\s*</script>\s*'\s*;", content, re.DOTALL)
if not match:
    # Try a broader search
    match = re.search(r"<script>'(.*?)</script>'", content, re.DOTALL)

if not match:
    print("Could not extract script block")
    sys.exit(1)

script_lines = match.group(1).strip().split("\n")
clean_js = []
for line in script_lines:
    line = line.strip()
    if line.startswith("'") and (line.endswith("'") or line.endswith("'+") or line.endswith("';")):
        # Extract the content inside the string literal
        inner = re.sub(r"^'", "", line)
        inner = re.sub(r"'\s*\+?$", "", inner)
        inner = re.sub(r"'\s*;$", "", inner)
        # Unescape escaped single quotes \'
        inner = inner.replace("\\'", "'")
        clean_js.append(inner)
    elif line.startswith('"') and (line.endswith('"') or line.endswith('"+') or line.endswith('";')):
        inner = re.sub(r'^"', '', line)
        inner = re.sub(r'"\s*\+?$', '', inner)
        inner = re.sub(r'"\s*;$', '', inner)
        inner = inner.replace('\\"', '"')
        clean_js.append(inner)
    else:
        clean_js.append(line)

js_code = "\n".join(clean_js)
# Print using a safe encoding handler
sys.stdout.reconfigure(encoding='utf-8')
print("--- EXTRACTED JAVASCRIPT ---")
print(js_code)
print("----------------------------")

# Check for syntax errors by parsing it with a simple AST or checking brackets
open_brackets = []
for i, char in enumerate(js_code):
    if char in "({[":
        open_brackets.append((char, i))
    elif char in ")}]":
        if not open_brackets:
            print(f"Unmatched closing bracket '{char}' at index {i}")
        else:
            last, idx = open_brackets.pop()
            if (char == ")" and last != "(") or (char == "}" and last != "{") or (char == "]" and last != "["):
                print(f"Mismatched brackets: '{last}' at {idx} and '{char}' at {i}")

if open_brackets:
    print(f"Unclosed brackets remaining: {open_brackets}")
else:
    print("Bracket matching check passed successfully.")
