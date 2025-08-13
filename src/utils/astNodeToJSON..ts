
 export function astNodeToJSON(node: any) {
  const result: any = {
    type: node.type,
    startPosition: node.startPosition,
    endPosition: node.endPosition,
  };

  if (node.children && node.children.length > 0) {
    result.children = node.children.map(astNodeToJSON);
  } else if (node.text) {
    result.text = node.text; // Only for leaf nodes
  }

  return result;
}


