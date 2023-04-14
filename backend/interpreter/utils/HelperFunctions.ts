import { Data, DataType } from './DataTypes'

// Helper Data Structures
export const scan_skip_set = new Set<string>([
  'compound_stmt',
  'parameter_type_list',
  'initializer',
  'iteration_stmt'
])

// Helper Functions
export const push = (array: any[], ...items: any[]) => {
  array.splice(array.length, 0, ...items)
  return array
}

export const peek = (array: any[]) => {
  return array.slice(-1)[0]
}

export const convert_to_data_type = (lexeme_type: any): DataType => {
  switch (lexeme_type) {
    case 'VOID':
      return DataType.VOID
    case 'CHAR':
      return DataType.CHAR
    case 'INT':
      return DataType.INT
    case 'DOUBLE':
      return DataType.DOUBLE
    default:
      throw new Error('Invalid data type')
  }
  return DataType.VOID
}

export const type_check = (accepted_types: DataType[], ...args: DataType[]) => {
  const set = new Set(accepted_types)
  for (const arg of args) {
    if (!set.has(arg)) {
      throw new Error('Error [Type Mismatch]' + arg + 'Expected: ' + accepted_types)
    }
  }
}

export const convert_lexeme_to_data = (lexeme_struct: any) => {
  switch (lexeme_struct.tokenClass) {
    case 'IDENTIFIER':
      return {
        value: lexeme_struct.lexeme,
        type: DataType.IDENTIFIER,
        size: 0,
        pos: 0,
        pointer_count: 0
      }
    case 'CONSTANT':
      const data = lexeme_struct.lexeme
      if (isNaN(Number(data))) {
        return { value: data, type: DataType.CHAR, size: 1, pos: 0, pointer_count: 0}
      } else if (Number.isInteger(Number(data)) && !data.includes('.')) {
        return { value: Number(data), type: DataType.INT, size: 1, pos: 0, pointer_count: 0 }
      } else {
        return { value: Number(data), type: DataType.DOUBLE, size: 1, pos: 0, pointer_count: 0 }
      }
    default:
      throw new Error('Invalid data type')
  }
}

export const get_data_size = (any: any) => {
  switch (any) {
    case DataType.CHAR:
      return 8
    case DataType.INT:
      return 8
    case DataType.DOUBLE:
      return 8
  }
  return 0
}

export const set_default_value = (address: number, M: Data[]) => {
  if (M[address] == undefined || M[address].value != undefined || M[address].size == undefined) {
    throw new Error('Error [set_default_value]: Memory address is undefined')
  }
  const size = M[address].size
  const type = M[address].type
  for (let i = address; i < address + size! * get_data_size(type); i += get_data_size(type)) {
    switch (type) {
      case DataType.CHAR:
        M[i].value = ''
        break
      case DataType.INT:
        M[i].value = 0
        break
      case DataType.DOUBLE:
        M[i].value = 0.0
        break
    }
  }
  return
}

export const count_parameters = (cmd: any, result: any) => {
  if (cmd.title === 'assignment_expr') {
    result.count++
  } else if (cmd.hasOwnProperty('children') && !cmd.hasOwnProperty('lexeme')) {
    for (let i = 0; i < cmd.children.length; i++) {
      count_parameters(cmd.children[i], result)
    }
  }
}

export const get_lexeme = (cmd: any): string => {
  if (cmd.hasOwnProperty('lexeme')) {
    return cmd.lexeme
  } else if (cmd.hasOwnProperty('children')) {
    return get_lexeme(cmd.children[0])
  } else {
    throw new Error('Error [get_lexeme - no Lexeme found]:')
  }
}
