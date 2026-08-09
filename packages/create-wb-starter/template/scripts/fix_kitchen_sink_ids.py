from bs4 import BeautifulSoup
import uuid
import os

file_path = r'c:\Users\jwpmi\Downloads\AI\wb-starter\demos\kitchen-sink.html'

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, 'html.parser')

def add_id(tag, prefix):
    if not tag.get('id'):
        tag['id'] = f"{prefix}-{uuid.uuid4().hex[:8]}"

# Find all containers that might need IDs (sections, divs, mains)
count = 0
for tag in soup.find_all(['section', 'div', 'main']):
    # Skip if it already has an ID
    if tag.get('id'):
        continue
    
    # The test complains about containers with > 1 children
    # We can be a bit aggressive or try to check children count
    # BeautifulSoup children includes newlines/text strings, so we need to be careful.
    # checking element children only
    element_children = [child for child in tag.children if child.name is not None]
    
    if len(element_children) > 1:
        # Logic based on class or tag type for nicer IDs, default to generic
        classes = tag.get('class', [])
        prefix = 'container'
        
        if tag.name == 'section':
            prefix = 'section'
        elif tag.name == 'main':
            prefix = 'main'
        elif 'demo-card' in classes:
             prefix = 'card'
        elif 'demo-grid' in classes:
             prefix = 'grid'
        
        add_id(tag, prefix)
        count += 1

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))

print(f"Added IDs to {count} elements in {file_path}")
