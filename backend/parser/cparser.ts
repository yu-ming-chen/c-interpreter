const parser = require('node-c-parser')

export const parse = (codeText: string) => {
  const tokens = parser.lexer.lexUnit.tokenize(codeText)
  const parseTree = parser.parse(tokens)
  return parseTree
}
