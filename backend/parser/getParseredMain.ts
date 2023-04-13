import * as fs from 'fs'

import { parse } from '../parser/cparser'

const codeText = fs.readFileSync('../test/main.c', 'utf8')
const obj = parse(codeText)

fs.writeFileSync('../test/main.json', JSON.stringify(obj))
