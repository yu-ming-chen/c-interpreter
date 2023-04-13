import * as fs from 'fs'
import { execute } from '../interpreter/cinterpreter'

const codeText = fs.readFileSync('../backend/test/main.c', 'utf8')

try {
  const result = execute(codeText)
  console.log(result)
} catch(e) {
  console.log(e.message)
}
