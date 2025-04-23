import re

# Within each line of code, obtain the values and the index. 
# For vertices, the first result describes the node number, the rest describe the labels.
# For edges, the first result describes the edge start, the second describes the edge end, and the rest describe the labels.
# def parse_elements_with_indices(input_str):
#     regex = re.finditer(r"-?\d+", input_str)  # Match integers, including negative numbers
#     results = [{"value": int(match.group()), "index": match.start()} for match in regex]
#     return results

# We want to convert the data into a graph object that can be used for a force-directed graph
# We'll have a very nested dictionary, to support d3 functions.
# {"nodes": node_dict, "links": edge_dict}
# node_dict: "node_id"=>Int, "node_index"=>Int, "labels"=>[Int], "label_indices"=>[int]
# edge_dict: "source"=>Int, "target"=>Int, "labels"=>[Int], "label_indices"=>[int]