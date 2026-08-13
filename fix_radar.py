import re
file_path = 'src/routes/idle.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Pattern for the map background div in the radar
pattern = r'(backgroundImage:\s*`url\(\$\{IDLE_MAPS\[idle\.currentMap \|\| \'vale_verdejante\'\]\?\.bg \|\| \'\'\}\)`,)(.*?)(\n\s*left:\s*\'50%\',\s*top:\s*\'50%\',\n\s*\}\}\s*/>)'

def replacement(match):
    prefix = match.group(1)
    middle = match.group(2)
    suffix = match.group(3)
    # We want to replace the suffix part (closing of the style object)
    # or just add the new properties before the closing.
    new_props = "\n              display: 'block', opacity: 1, visibility: 'visible', zIndex: 1,"
    return prefix + middle + new_props + suffix

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

if new_content != content:
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print("FAILURE")
