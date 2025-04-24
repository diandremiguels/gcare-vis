import os
import re
from collections import defaultdict
from django.conf import settings

# Creates two maps of the queries
# One map takes all queries and sorts them based on which dataset they belong to.
# The other map takes all queries and sorts them based on what type of pattern they represent.
def categorize_files(base_folder, pattern_regex=r'(\w+)_\d+'):
    folder_map = defaultdict(list)  # Folder => all files (with parent folder name)
    pattern_map = defaultdict(list)  # Pattern => files (from pattern subfolders)

    for folder in os.listdir(os.path.join(os.getcwd(), base_folder)):  # Iterate over top-level folders
        folder_path = os.path.join(base_folder, folder)
        if not os.path.isdir(folder_path):
            continue  # Skip files at base level

        all_files = []  # Collect all files in this folder (with parent folder name)
        direct_files = []  # Collect files directly in folder (for misc category)

        for root, _, files in os.walk(folder_path):  # Recursively collect files
            relative_root = os.path.relpath(root, folder_path)  # Relative to the top-level folder
            for file in files:
                # Ensure paths use forward slashes (cross-platform)
                if relative_root == '.':
                    rel_path = os.path.join(folder, file)  # No subfolder, directly in folder
                else:
                    rel_path = os.path.join(folder, relative_root, file)
                
                # Normalize the path to use forward slashes
                rel_path = rel_path.replace(os.sep, '/')
                
                all_files.append(rel_path)

                # Check if file is inside a pattern-based subfolder
                subfolder_name = os.path.basename(root)  # Get last folder in path
                pattern_match = re.match(pattern_regex, subfolder_name)
                if pattern_match:
                    base_pattern = pattern_match.group(1)  # Extract base pattern (e.g., 'chain', 'graph')
                    pattern_map[base_pattern].append(rel_path)
                elif root == folder_path:  # File is directly inside top-level folder
                    direct_files.append(rel_path)

        # Store all collected files in folder_map (with parent folder names)
        folder_map[folder] = all_files

        # If there were direct files in the folder, add them to "misc" in pattern_map
        if direct_files:
            pattern_map["misc"].extend(direct_files)

    return dict(folder_map), dict(pattern_map)

# Given a query file path, returns the string contents of that file. 
def read_file(filepath):
    path = os.getcwd().join('fileprocessor/static/' + filepath)
    contents = ''
    with open(path, 'r') as f:
        contents = f.read()
    return contents