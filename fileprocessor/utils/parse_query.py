def parse_graph_with_label_offsets(string_content):
    nodes = []
    edges = []
    edge_counter = 0

    # with open(filepath, 'r') as f:
    offset = 0
    for line in string_content.splitlines():
        line = line.rstrip('\n')
        line_length = len(line) + 1  # include newline
        start_offset = offset
        end_offset = offset + line_length
        end_vertex = 0
        end_edge = 0

        parts = line.split()
        if not parts:
            offset = end_offset
            continue

        # Track character positions of each part
        char_ranges = []
        current_pos = offset
        current_element = 0
        for part in parts:
            start = line.find(part, current_pos - offset) + offset
            end = start + len(part)
            char_ranges.append((start, end))
            current_pos = end + 1  # assume 1 space separator
            current_element += 1
            if current_element == 2:
                end_vertex = current_pos
            elif current_element == 3:
                end_edge = current_pos

        if parts[0] == 'v':
            node_id = int(parts[1])
            labels = []
            for i in range(2, len(parts)):
                labels.append({
                    'value': int(parts[i]),
                    'char_range': char_ranges[i]
                })
            nodes.append({
                'id': node_id,
                'labels': labels,
                'char_range': (start_offset, end_vertex)
            })

        elif parts[0] == 'e':
            src = int(parts[1])
            dst = int(parts[2])
            label = int(parts[3])
            from_to_start = char_ranges[1][0]
            from_to_end = char_ranges[2][1]

            edge_id = f"e{edge_counter}"
            edge_counter += 1

            edges.append({
                'id': edge_id,
                'from': src,
                'to': dst,
                'from_to_range': (from_to_start, from_to_end),
                'label': {
                    'value': label,
                    'char_range': char_ranges[3]
                },
                'char_range': (start_offset, end_edge)
            })

        offset = end_offset

    return nodes, edges, obtain_elk_graph(nodes, edges)

# When we hover over an edge / node, we need to find its id.
# then, we need to find the corresponding character ranges for the element with the given id
# after we find the corresponding character range, we reset hwt to only highlight the character range we want.

def obtain_elk_graph(nodes, edges):
    elk_graph = {
        "id": "root",
        "layoutOptions": {"elk.algorithm": "stress"},
        "children": [],
        "edges": []
    }
    for node in nodes:
        elk_graph["children"].append({
            "id": str(node["id"]),
            "width": 30,
            "height": 30
        })

    for i, edge in enumerate(edges):
        elk_graph["edges"].append({
            "id": str(edge["id"]),
            "sources": [str(edge["from"])],
            "targets": [str(edge["to"])],
            "labels": [{ "text": str(edge["label"]["value"]) }]
        })
    return elk_graph