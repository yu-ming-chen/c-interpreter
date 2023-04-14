import { parse } from '../parser/cparser'
import { print_env, print_memory, printf } from './utils/BuiltinFunctions'
import { Data, DataSize, DataType, EnvNode, LinkedListNode, NULL_POINTER_COUNT, NULL_SIZE, NULL_VAL, ScanData } from './utils/DataTypes'
import {
  convert_lexeme_to_data,
  convert_to_data_type,
  count_parameters,
  get_data_size,
  get_lexeme,
  peek,
  push,
  scan_skip_set,
  set_default_value,
  type_check
} from './utils/HelperFunctions'

// Interpreter Constructs
const MEMORY_SIZE = 10000
const M = new Array(MEMORY_SIZE)
const S_SIZE = MEMORY_SIZE / 2
const H_SIZE = MEMORY_SIZE / 2
let s_fptr = 0
const heap_ll: LinkedListNode = {
  head: { address: S_SIZE, size: H_SIZE, is_occupied: false },
  tail: null
}
let E: EnvNode | null
let A: any[]
let S: any[]

// SCAN
const scan_sym = (ast: any, result: any) => {
  if (
    ast.hasOwnProperty('lexeme') &&
    ast.hasOwnProperty('tokenClass') &&
    ast.tokenClass === 'IDENTIFIER'
  ) {
    result.sym = ast.lexeme
  } else if (ast.hasOwnProperty('title') && scan_skip_set.has(ast.title)) {
    return
  } else if (ast.hasOwnProperty('children') && !ast.hasOwnProperty('lexeme')) {
    for (let i = 0; i < ast.children.length; i++) {
      scan_sym(ast.children[i], result)
    }
  }
}

const scan_type = (ast: any, result: any) => {
  if (ast.hasOwnProperty('title') && ast.title === 'type_specifier') {
    result.type = convert_to_data_type(ast.children[0].tokenClass)
  } else if (ast.hasOwnProperty('title') && scan_skip_set.has(ast.title)) {
    return
  } else if (ast.hasOwnProperty('children') && !ast.hasOwnProperty('lexeme')) {
    for (let i = 0; i < ast.children.length; i++) {
      scan_type(ast.children[i], result)
    }
  }
}

const find_primary_expression_for_size = (expr: any): number => {
  if (expr.hasOwnProperty('tokenClass') && expr.tokenClass === 'CONSTANT') {
    return parseInt(expr.lexeme)
  } else {
    return find_primary_expression_for_size(expr.children[0])
  }
}

const scan_size = (ast: any, result: any) => {
  if (
    ast.hasOwnProperty('title') &&
    ast.title === 'direct_declarator' &&
    ast.children[1].children.length === 1
  ) {
    result.size = 1
    return
  } else if (
    ast.hasOwnProperty('title') &&
    ast.title === 'direct_declarator' &&
    ast.children[1].hasOwnProperty('children') &&
    ast.children[1].children.length === 4 &&
    ast.children[1].children[1].hasOwnProperty('title') &&
    ast.children[1].children[1].title === 'assignment_expr'
  ) {
    result.size = find_primary_expression_for_size(ast.children[1].children[1])
    return
  } else if (ast.hasOwnProperty('title') && scan_skip_set.has(ast.title)) {
    return
  } else if (ast.hasOwnProperty('children') && !ast.hasOwnProperty('lexeme')) {
    for (let i = 0; i < ast.children.length; i++) {
      scan_size(ast.children[i], result)
    }
  }
}

const scan_memory = (ast: any, result: any) => {
  if (
    ast.hasOwnProperty('tokenClass') &&
    ast.tokenClass === 'IDENTIFIER' &&
    ast.lexeme === 'malloc'
  ) {
    result.is_stack = false
  } else if (ast.hasOwnProperty('title') && scan_skip_set.has(ast.title)) {
    return
  } else if (ast.hasOwnProperty('children') && !ast.hasOwnProperty('lexeme')) {
    for (let i = 0; i < ast.children.length; i++) {
      scan_memory(ast.children[i], result)
    }
  }
}

const scan_pointer = (ast: any, result: any) => {
  if (ast.hasOwnProperty('title') && ast.title == 'pointer') {
    result.pointer_count += 1
    for (let i = 0; i < ast.children.length; i++) {
      scan_pointer(ast.children[i], result)
    }
  } else if (
    ast.hasOwnProperty('tokenClass') ||
    (ast.hasOwnProperty('children') && scan_skip_set.has(ast.title))
  ) {
    return
  } else if (ast.hasOwnProperty('children') && !ast.hasOwnProperty('lexeme')) {
    for (let i = 0; i < ast.children.length; i++) {
      scan_pointer(ast.children[i], result)
    }
  }
}

const scan_declaration = (declaration: any): ScanData => {
  const result: ScanData = {
    sym: '',
    type: DataType.VOID,
    size: 0,
    is_stack: true,
    is_function: false,
    pointer_count: 0
  }
  scan_sym(declaration, result)
  scan_type(declaration, result)
  scan_size(declaration, result)
  scan_memory(declaration, result)
  scan_pointer(declaration, result)
  return result
}

const scan_function_definition = (func_definition: any): ScanData => {
  const result: ScanData = {
    sym: '',
    type: DataType.VOID,
    size: 0,
    is_stack: true,
    is_function: true,
    pointer_count: 0
  }
  scan_sym(func_definition, result)
  scan_type(func_definition, result)
  scan_pointer(func_definition, result)
  return result
}

const scan = (ast: any, result: any, is_first_scan: boolean) => {
  // Stop conditions
  if ((!ast.hasOwnProperty('title') || ast.title === 'compound_stmt') && !is_first_scan) {
    return
  }

  // Execute conditions
  if (ast.title === 'declaration') {
    result.push(scan_declaration(ast))
  } else if (ast.title === 'function_definition') {
    result.push(scan_function_definition(ast))
  } else if (ast.hasOwnProperty('children') && !ast.hasOwnProperty('lexeme')) {
    for (let i = 0; i < ast.children.length; i++) {
      scan(ast.children[i], result, false)
    }
  }
}

// GENERATE DEFAULT VALUES
const convert_sym_to_default_val = (data: ScanData): Data[] => {
  const results: Data[] = []
  for (let i = 0; i < data.size; i++) {
    if (data.type === DataType.IDENTIFIER || data.type === DataType.VOID) {
      throw new Error('Error [Cannot convert identifier/void to default value]: ' + data.type)
    }
    results.push({
      value: NULL_VAL,
      type: data.type,
      size: data.size,
      pos: i,
      pointer_count: data.pointer_count
    })
  }
  return results
}

const generate_default_values = (syms: ScanData[]): Data[][] => {
  const results: Data[][] = []
  for (let i = 0; i < syms.length; i++) {
    results.push(convert_sym_to_default_val(syms[i]))
  }
  return results
}

const split_stack_heap_scan_data = (data: ScanData[]): [ScanData[], ScanData[], ScanData[]] => {
  const s_syms: ScanData[] = []
  const h_syms: ScanData[] = []
  const f_syms: ScanData[] = []

  for (let i = 0; i < data.length; i++) {
    if (data[i].is_function) {
      f_syms.push(data[i])
    } else if (data[i].is_stack) {
      s_syms.push(data[i])
    } else {
      h_syms.push(data[i])
    }
  }
  return [s_syms, h_syms, f_syms]
}

// EXTEND
const extend_environment = (cmd: any, env: EnvNode | null) => {
  const scan_result: ScanData[] = []
  scan(cmd, scan_result, true)
  const s_h_scan_data = split_stack_heap_scan_data(scan_result)
  const s_syms = s_h_scan_data[0]
  const h_syms = s_h_scan_data[1]
  const f_syms = s_h_scan_data[2]
  const s_def_val = generate_default_values(s_syms)
  const h_def_val = generate_default_values(h_syms)
  E = extend(s_syms, s_def_val, h_syms, h_def_val, f_syms, env)
}

const extend_and_assign_params_to_environment = (params: ScanData[], args: Data[]) => {
  const param_default_values = generate_default_values(params)
  extend_stack(params, param_default_values, E?.env)
  for (let i = 0; i < params.length; i++) {
    const data = {
      value: params[i].sym,
      size: params[i].size,
      type: params[i].type,
      pos: 0,
      pointer_count: params[i].pointer_count
    }
    assign([data], [args[i]], E)
  }
}

const extend = (
  s_syms: ScanData[],
  s_default_values: Data[][],
  h_syms: ScanData[],
  h_default_values: Data[][],
  f_syms: ScanData[],
  e: EnvNode | null
) => {
  const new_frame = {}
  const prev_ptr = s_fptr
  extend_stack(s_syms, s_default_values, new_frame)
  extend_heap(h_syms, new_frame)
  extend_function(f_syms, new_frame)
  return new EnvNode(e, new_frame, prev_ptr)
}

const extend_stack = (syms: ScanData[], default_values: Data[][], new_frame: any) => {
  if (default_values.length != syms.length) throw new Error('Error [Wrong # of parameters]')
  for (let i = 0; i < syms.length; i++) {
    if (s_fptr + DataSize[syms[i].type] * syms[i].size > S_SIZE) {
      throw new Error('Error [Stack overflow]')
    }
    new_frame[syms[i].sym] = s_fptr
    for (let j = 0; j < syms[i].size; j++) {
      M[s_fptr] = default_values[i][j]
      s_fptr += get_data_size(syms[i].type)
    }
  }
}

const look_for_free_heap = (size: Data): number => {
  let ptr: LinkedListNode | null = heap_ll
  if (size.type == DataType.IDENTIFIER) {
    size = get_sym_value(size)
  }
  if (size.type != DataType.INT) throw new Error('Error [Heap size must be int]: ' + size.type)
  const required_size = size.value
  while (ptr != null) {
    if (ptr.head.size > required_size) {
      if (ptr.tail === null) {
        ptr.tail = {
          head: {
            address: ptr.head.address + required_size,
            size: ptr.head.size - required_size,
            is_occupied: false
          },
          tail: null
        }
      } else if (ptr.tail.head.is_occupied) {
        ptr.tail = {
          head: {
            address: ptr.head.address + required_size,
            size: ptr.head.size - required_size,
            is_occupied: false
          },
          tail: ptr.tail
        }
      } else {
        ptr.tail = {
          head: {
            address: ptr.head.address + required_size,
            size: ptr.head.size - required_size + ptr.tail.head.size,
            is_occupied: false
          },
          tail: ptr.tail.tail
        }
      }
      ptr.head = { address: ptr.head.address, size: required_size, is_occupied: true }
      return ptr.head.address
    } else if (ptr.head.size === required_size) {
      ptr.head.is_occupied = true
      return ptr.head.address
    } else {
      ptr = ptr.tail
    }
  }
  throw new Error('Error [Could not find heap space]')
}

const extend_heap = (syms: ScanData[], new_frame: any) => {
  for (let i = 0; i < syms.length; i++) {
    new_frame[syms[i].sym] = s_fptr
    M[s_fptr] = {
      value: undefined,
      size: 1,
      type: syms[i].type,
      pos: 0,
      pointer_count: syms[i].pointer_count
    }
    s_fptr += get_data_size(syms[i].type)
  }
}

const assign_heap = (size: Data, e: EnvNode | null) => {
  if (e === null) throw new Error('Error [assign heap]: No env')
  const sym = peek(S)
  const pointer_in_stack = get_sym_value(sym)
  if (pointer_in_stack.pointer_count == 0) throw new Error('Error [assign heap]: Not a pointer')
  const heap_address = look_for_free_heap(size)
  if (size.type == DataType.IDENTIFIER) {
    size = get_sym_value(size)
  }
  const malloc_size = size.value
  const data_length = malloc_size / get_data_size(pointer_in_stack.type)

  //create a new scan data
  const scan_data = {
    sym: pointer_in_stack.sym,
    type: pointer_in_stack.type,
    size: data_length,
    is_stack: false,
    is_function: false
  } as ScanData

  const default_vals = convert_sym_to_default_val(scan_data)

  for (let i = 0; i < scan_data.size; i++) {
    M[heap_address + i * get_data_size(scan_data.type)] = default_vals[i]
  }
  const heap_data = {
    value: heap_address,
    type: pointer_in_stack.type,
    size: scan_data.size,
    pointer_count: 1,
    pos: 0
  }
  return heap_data
}

const extend_function = (f_syms: ScanData[], new_frame: any) => {
  for (let i = 0; i < f_syms.length; i++) {
    new_frame[f_syms[i].sym] = undefined
  }
}

const heap_free = (address: number) => {
  if (address < S_SIZE) throw new Error('Error [Heap Free]: Address is not in heap space')
  let ptr: LinkedListNode | null = heap_ll
  let freed = false
  while (ptr != null) {
    if (ptr.head.address === address && ptr.head.is_occupied) {
      freed = true
      ptr.head.is_occupied = false
      M.fill(undefined, address, address + ptr.head.size)
      break
    }
    ptr = ptr.tail
  }
  if (!freed) {
    throw new Error('Error [Heap Free]: Occupided address not found in heap')
  }
  heap_compression()
}

const heap_compression = () => {
  let ptr: LinkedListNode | null = heap_ll
  while (ptr != null) {
    if (!ptr.head.is_occupied && ptr.tail != null && !ptr.tail.head.is_occupied) {
      ptr.head.size += ptr.tail.head.size
      ptr.tail = ptr.tail.tail
    }
    ptr = ptr.tail
  }
}

/**
 * Lookup returns the base address of the variable, even if it is an array.
 * For e.g. lookup(arr) returns arr[0] memory address.
 */
export const lookup: any = (sym: string, e: EnvNode) => {
  if (e === null) {
    throw new Error('Error [Lookup - Unbound Name]: ' + sym)
  } else if (e.env.hasOwnProperty(sym)) {
    // TODO: possible change to another place to check for use after free
    if (e.env[sym] === NULL_VAL) throw new Error('Error [Use After Free]: ' + sym)
    return e.env[sym]
  } else {
    return lookup(sym, e.parent)
  }
}

/**
 * Assigns value in M at the corresponding addresses with actual Data struct value
 * @param sym Expects sym representing one variable/ one array.
 * @param val Expects values wrapped in Data[]. Single variable: [Data]; Array: [Data, Data, Data]
 */
const assign = (sym: Data[], val: Data[], e: EnvNode | null) => {
  if (e === null) {
    throw new Error('Error [Assign - Unbound Name]: ' + sym)
  } else if (e.env.hasOwnProperty(sym[0].value)) {
    if (sym.length != val.length) {
      throw new Error('Error [Assign - Arity Mismatch]')
    }
    for (let i = 0; i < val.length; i++) {
      let curr_value = val[i]
      const sym_data_on_stack = get_sym_value(sym[i])
      if (curr_value.type === DataType.IDENTIFIER) {
        curr_value = get_sym_value(curr_value)
      }
      if (sym_data_on_stack.type != curr_value.type) {
        throw new Error(
          'Error [Assign - Different type]: Expected:' +
          sym_data_on_stack.type +
          ', Received: ' +
          curr_value.type
        )
      }
      const address = lookup(sym[i].value, E) + sym[i].pos * get_data_size(curr_value.type)
      M[address].value = curr_value.value
    }
  } else if (sym[0].hasOwnProperty('is_heap')) {
    const address = sym[0].value
    M[address].value = val[0].value
  } else {
    assign(sym, val, e.parent)
  }
}

export const get_sym_value = (sym: Data) => {
  const address = lookup(sym.value, E)
  const head_data = M[address]
  return M[address + sym.pos * get_data_size(head_data.type)]
}

const get_base_address = (data: Data, address: number) => {
  return address - DataSize[data.type] * data.pos
}

const find_sym_from_address = (address: number, data_pos: number, e: any): Data => {
  if (e === null) throw Error('Error [Find sym - Unknown address]: ' + address)
  else {
    for (const [key, value] of Object.entries(e.env)) {
      if (value == address) {
        return {
          value: key,
          type: DataType.IDENTIFIER,
          size: 1,
          pointer_count: M[address].pointer_count,
          pos: data_pos
        }
      }
    }
    return find_sym_from_address(address, data_pos, e.parent)
  }
}

const apply_unop = (op: string, v1: Data) => {
  return unop_microcode[op](v1)
}

// Note: We only support (Int, Int), not (Int, Double) calculations.
const apply_binop = (op: string, v2: Data, v1: Data) => {
  if (v1.type === DataType.IDENTIFIER) v1 = get_sym_value(v1)
  if (v2.type === DataType.IDENTIFIER) v2 = get_sym_value(v2)

  if (v1.hasOwnProperty('is_heap')) v1 = M[v1.value]
  if (v2.hasOwnProperty('is_heap')) v2 = M[v2.value]

  // Type checking
  if (v1.value == NULL_VAL || v2.value == NULL_VAL)
    throw new Error('Type Error [Binop Args - Use before initialisation]')
  if (v1.type != v2.type) throw new Error('Type Error [Binop Args - Diff Type]')

  return binop_microcode[op](v1, v2)
}

const apply_builtin = (builtin_symbol: any, args: any) => builtin_mapping[builtin_symbol](...args)

// Note: Only operating on CONSTANTS. Does not support identifiers as they are resolved on Agenda (A).
const binop_microcode = {
  '+': (x: Data, y: Data) => {
    type_check([DataType.CHAR, DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value + y.value, type: x.type, size: 1, pointer_count: 0 }
  },
  '*': (x: Data, y: Data) => {
    type_check([DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value * y.value, type: x.type, size: 1, pointer_count: 0 }
  },
  '-': (x: Data, y: Data) => {
    type_check([DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value - y.value, type: x.type, size: 1, pointer_count: 0 }
  },
  '/': (x: Data, y: Data) => {
    type_check([DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value / y.value, type: x.type, size: 1, pointer_count: 0 }
  },
  '%': (x: Data, y: Data) => {
    type_check([DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value % y.value, type: x.type, size: 1, pointer_count: 0 }
  },
  '<': (x: Data, y: Data) => {
    type_check([DataType.CHAR, DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value < y.value ? 1 : 0, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '>': (x: Data, y: Data) => {
    type_check([DataType.CHAR, DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value > y.value ? 1 : 0, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '|': (x: Data, y: Data) => {
    type_check([DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value | y.value, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '^': (x: Data, y: Data) => {
    type_check([DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value ^ y.value, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '&': (x: Data, y: Data) => {
    type_check([DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value & y.value, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '<<': (x: Data, y: Data) => {
    type_check([DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value << y.value, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '>>': (x: Data, y: Data) => {
    type_check([DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value >> y.value, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '==': (x: Data, y: Data) => {
    type_check([DataType.CHAR, DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value === y.value ? 1 : 0, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '!=': (x: Data, y: Data) => {
    type_check([DataType.CHAR, DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value !== y.value ? 1 : 0, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '<=': (x: Data, y: Data) => {
    type_check([DataType.CHAR, DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value <= y.value ? 1 : 0, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '>=': (x: Data, y: Data) => {
    type_check([DataType.CHAR, DataType.INT, DataType.DOUBLE], x.type, y.type)
    return { value: x.value >= y.value ? 1 : 0, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '&&': (x: Data, y: Data) => {
    type_check([DataType.INT], x.type, y.type)
    return { value: x.value && y.value ? 1 : 0, type: DataType.INT, size: 1, pointer_count: 0 }
  },
  '||': (x: Data, y: Data) => {
    type_check([DataType.INT], x.type, y.type)
    return { value: x.value || y.value ? 1 : 0, type: DataType.INT, size: 1, pointer_count: 0 }
  }
}
// Note: Supports CONSTANTS and IDENTIFIERS. TODO: STRING_LITERAL.
const unop_microcode = {
  '++': (x: Data) => {
    type_check([DataType.IDENTIFIER], x.type)
    x = get_sym_value(x)

    if (x.pointer_count > 0) {
      return {
        value: x.value + get_data_size(x.type),
        type: x.type,
        size: 1,
        pointer_count: x.pointer_count
      }
    }

    if (x.value === NULL_VAL) throw new Error('Type Error [UNOP - Use before initialisation]')
    return { value: x.value + 1, type: x.type, size: 1, pointer_count: x.pointer_count }
  },
  '--': (x: Data) => {
    type_check([DataType.IDENTIFIER], x.type)
    x = get_sym_value(x)

    if (x.pointer_count > 0) {
      return {
        value: x.value - get_data_size(x.type),
        type: x.type,
        size: 1,
        pointer_count: x.pointer_count
      }
    }

    if (x.value === NULL_VAL) throw new Error('Type Error [UNOP - Use before initialisation]')
    return { value: x.value - 1, type: x.type, size: 1, pointer_count: x.pointer_count }
  },
  '&': (x: Data) => {
    type_check([DataType.IDENTIFIER], x.type)
    const data = get_sym_value(x)
    if (data.value === NULL_VAL) throw new Error('Type Error [UNOP - Use before initialisation]')
    return {
      value: lookup(x.value, E) + x.pos * get_data_size(data.type),
      type: data.type,
      size: data.size,
      pointer_count: data.pointer_count + 1,
      pos: data.pos
    }
  },
  '*': (x: Data) => {
    const ptr_data = get_sym_value(x)

    if (ptr_data.value >= S_SIZE) {
      return {
        value: ptr_data.value,
        type: ptr_data.type,
        size: 1,
        pointer_count: ptr_data.pointer_count,
        is_heap: true
      }
    }
    const sym_address = ptr_data.value
    const sym_data_at_address = M[sym_address]
    const base_address = get_base_address(sym_data_at_address, sym_address)
    const sym = find_sym_from_address(base_address, sym_data_at_address.pos, E)
    return sym
  },
  '!': (x: Data) => {
    type_check([DataType.INT, DataType.IDENTIFIER], x.type)
    if (x.type === DataType.IDENTIFIER) x = get_sym_value(x)
    if (x.value === NULL_VAL) throw new Error('Type Error [UNOP - Use before initialisation]')
    return { value: x.value === 0 ? 1 : 0, type: DataType.INT, size: 1, pointer_count: 0 }
  }
}

const builtin_mapping = {
  print_memory: () => print_memory(E, M),
  print_env: () => print_env(E),
  printf: (...args: any[]) => printf(E, M, ...args),
  malloc: (size: Data) => assign_heap(size, E),
  free: (ptr: Data) => {
    const address = get_sym_value(ptr).value
    E!.env[ptr.value] = NULL_VAL
    return heap_free(address)
  }
}

const microcode = {
  // -------------- Expressions --------------
  // abstract_declarator:
  additive_expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // additive_expr_p
        cmd.children[0] // multiplicative_expr
      )
    } else {
      throw new Error('Error [additive_expr]: Unexpected Child Length')
    }
  },
  additive_expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0])
    } else if (cmd.children.length === 3) {
      push(
        A,
        { title: 'binop_i', op: cmd.children[0].lexeme },
        cmd.children[2], // additive_expr_p
        cmd.children[1] // multiplicative_expr
      )
    } else {
      throw new Error('Error [additive_expr_p]: Unexpected Child Length')
    }
  },
  and_expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // and_expr_p
        cmd.children[0] // equality_expr
      )
    } else {
      throw new Error('Error [and_expr]: Unexpected Child Length')
    }
  },
  and_expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (cmd.children.length === 3) {
      push(
        A,
        { title: 'binop_i', op: cmd.children[0].lexeme },
        cmd.children[2], // and_expr_p
        cmd.children[1] // equality_expr
      )
    } else {
      throw new Error('Error [and_expr]: Unexpected Child Length')
    }
  },
  argument_expr_list: (cmd: any) => {
    // 1,2,3
    if (cmd.children.length === 2) {
      push(A, cmd.children[1], cmd.children[0])
    } else {
      throw new Error('Error [argument_expr_list]: Unexpected Child Length')
    }
  },
  argument_expr_list_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (cmd.children.length === 3) {
      push(
        A,
        cmd.children[2], // argument_expr_list_p
        cmd.children[1] // assignment_expr
      )
    } else {
      throw new Error('Error [argument_expr_list_p]: Unexpected Child Length')
    }
  },
  assignment_expr: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // conditional_expr
    } else if (cmd.children.length === 3) {
      push(
        A,
        { title: 'assmt_i', op: cmd.children[1].children[0].lexeme }, // assignment_operator: +=, -= etc.
        cmd.children[2], // assignment_expr
        cmd.children[0] // unary_expr
      )
      push(S, { marker: 'assmt_marker' })
    } else {
      throw new Error('Error [assignment_expr]: Unexpected Child Length')
    }
  },
  block_item_list: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // block_item_list_p
        cmd.children[0] // block_item
      )
    } else {
      throw new Error('Error [block_item_list]: Unexpected Child Length')
    }
  },
  block_item_list_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) //EPSILON
    } else if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // block_item_list_p
        cmd.children[0], // block_item
        { title: 'pop_i' }
      )
    } else {
      throw new Error('Error [block_item_list_p]: Unexpected Child Length')
    }
  },
  block_item: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // stmt | declaration (1)
    } else {
      throw new Error('Error [block_item]: Unexpected Child Length')
    }
  },
  cast_expr: (cmd: any) => {
    // TODO: Type casting
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // unary_expr
    } else if (cmd.children.length === 4) {
      push(
        A,
        { title: 'cast_i' },
        cmd.children[3], // cast_expr
        cmd.children[1] // type_name
      )
    } else {
      throw new Error('Error [cast_expr]: Unexpected Child Length')
    }
  },
  compound_stmt: (cmd: any) => {
    const E_parent = E
    if (cmd.children.length === 2) {
      extend_environment(cmd, E)
      push(A, { title: 'env_i', env: E_parent })
    } else if (cmd.children.length === 3) {
      extend_environment(cmd, E)
      push(A, { title: 'env_i', env: E_parent }, cmd.children[1]) // block_item_list
    } else {
      throw new Error('Error [compound_stmt]: Unexpected Child Length')
    }
  },
  conditional_expr: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // logical_or_expr
    } else if (cmd.children.length === 5) {
      push(
        A,
        { title: 'branch_i', cond: cmd.children[2], alt: cmd.children[4] }, // ? expr : conditional_expr
        cmd.children[0] // logical_or_expr
      )
    } else {
      throw new Error('Error [conditional_expr]: Unexpected Child Length')
    }
  },
  constant_expr: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // conditional_expr
    } else {
      throw new Error('Error [constant_expr]: Unexpected Child Length')
    }
  },
  declaration: (cmd: any) => {
    if (cmd.children.length === 3) {
      push(A, cmd.children[1]) // init_declarator_list
    } else {
      throw new Error('Error [declaration]: Unexpected Child Length')
    }
  },
  declaration_list: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // declaration_list_p
        cmd.children[0] // declaration
      )
    } else {
      throw new Error('Error [declaration_list]: Unexpected Child Length')
    }
  },
  declaration_list_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // type_specifier
    } else {
      throw new Error('Error [declaration_list_p]: Unexpected Child Length')
    }
  },
  declaration_specifiers: (cmd: any) => {
    if (
      cmd.children.length === 1 &&
      cmd.children[0].hasOwnProperty('title') &&
      cmd.children[0].title === 'type_specifier'
    ) {
      push(A, cmd.children[0]) // type_specifier
    } else {
      throw new Error('Error [declaration_specifiers]: Unexpected Child Length')
    }
  },
  declarator: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // direct_declarator
    } else if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // direct_declarator
        cmd.children[0] // pointer
      )
    } else {
      throw new Error('Error [Declarator]: Unexpected Child Length')
    }
  },
  designation: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(A, cmd.children[0])
    } else {
      throw new Error('Error [designation]: Unexpected Child Length')
    }
  },
  designator_list: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // designator_list_p
        cmd.children[0] // designator
      )
    } else {
      throw new Error('Error [designator_list]: Unexpected Child Length')
    }
  },
  designator_list_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // designator_list_p
        cmd.children[0] // designator
      )
    } else {
      throw new Error('Error [designator_list_p]: Unexpected Child Length')
    }
  },
  designator: (cmd: any) => {
    throw new Error('Error [designator]: Not yet implemented')
  },
  // direct_abstract_declarator
  // direct_abstract_declarator_p
  direct_declarator: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(S, {
        value: cmd.children[0].lexeme,
        type: DataType.IDENTIFIER,
        size: NULL_SIZE,
        pointer_count: NULL_POINTER_COUNT,
        pos: 0
      }) // IDENTIFIER
      push(A, cmd.children[1]) // direct_declarator_p
    } else if (cmd.children.length === 4) {
      push(
        A,
        cmd.children[3], // direct_declarator_p
        cmd.children[1] // declarator
      )
    } else {
      throw new Error('Error [Direct Declarator]: Unexpected Child Length')
    }
  },
  direct_declarator_p: (cmd: any) => {
    // TODO: 2D Array ?
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (
      cmd.children.length > 1 &&
      cmd.children[1].hasOwnProperty('title') &&
      cmd.children[1].title === 'parameter_type_list'
    ) {
      push(A, cmd.children[1])
    } else if (
      cmd.children.length > 1 &&
      cmd.children[1].hasOwnProperty('title') &&
      cmd.children[1].title === 'assignment_expr'
    ) {
      return
    } else if (cmd.children.length === 3) {
      return
    } else {
      throw new Error('Error [direct_declarator_p]: incorrect number of children')
    }
  },
  EPSILON: (cmd: any) => { },
  // enum_specifier
  // enumerator
  // enumerator_list
  // enumerator_list_p
  equality_expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // equality_expr_p
        cmd.children[0] // relational_expr
      )
    } else {
      throw new Error('Error [equality_expr]: incorrect number of children')
    }
  },
  equality_expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (cmd.children.length === 3) {
      push(
        A,
        { title: 'binop_i', op: cmd.children[0].lexeme },
        cmd.children[2], // equality_expr_p
        cmd.children[1] // relational_expr
      )
    } else {
      throw new Error('Error [equality_expr_p]: incorrect number of children')
    }
  },
  exclusive_or_expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // exclusive_or_expr_p
        cmd.children[0] // and_expr
      )
    } else {
      throw new Error('Error [exclusive_or_expr]: incorrect number of children')
    }
  },
  exclusive_or_expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (cmd.children.length === 3) {
      push(
        A,
        { title: 'binop_i', op: cmd.children[0].lexeme },
        cmd.children[2], // exclusive_or_expr_p
        cmd.children[1] // and_expr
      )
    } else {
      throw new Error('Error [exclusive_or_expr_p]: incorrect number of children')
    }
  },
  expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // expr_p
        cmd.children[0] // assignment_expr
      )
    } else {
      throw new Error('Error [expr]: incorrect number of children')
    }
  },
  expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0])
    } else if (cmd.children.length === 3) {
      push(A, cmd.children[2], cmd.children[1])
    } else {
      throw new Error('Error [expr]: incorrect number of children')
    }
  },
  expression_stmt: (cmd: any) => {
    if (cmd.children.length === 1) {
      return
    } else if (cmd.children.length === 2) {
      push(A, cmd.children[0]) // expr
    } else {
      throw new Error('Error [expression_stmt]: incorrect number of children')
    }
  },
  external_declaration: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // function_definition | declaration
    } else {
      throw new Error('Error [external_declaration]: incorrect number of children')
    }
  },
  function_definition: (cmd: any) => {
    if (cmd.children.length === 3) {
      push(S, { marker: 'lambda_assign_marker_i' }) // function_name_and_return_type_marker
      push(
        A,
        { title: 'function_assign', comp: cmd.children[2] }, // compound_stmt
        cmd.children[1], // declarator (identifier, parameters)
        cmd.children[0] // declaration_specifiers (type_specifier) -> return type //
      )
    } else if (cmd.children.length === 4) {
      throw new Error(
        'Error [function_definition]: Not supporting function definitions with optional declaration list'
      )
    } else {
      throw new Error('Error [function_definition]: incorrect number of children')
    }
  },
  // function_specifier
  identifier_list: (cmd: any) => {
    push(A, cmd.children[1], cmd.children[0])
  },
  identifier_list_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0])
    } else {
      push(A, cmd.children[2], cmd.children[1])
    }
  },
  inclusive_or_expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // inclusive_or_expr_p
        cmd.children[0] // exclusive_or_expr
      )
    } else {
      throw new Error('Error [inclusive_or_expr]: incorrect number of children')
    }
  },
  inclusive_or_expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0])
    } else if (cmd.children.length === 3) {
      push(
        A,
        { title: 'binop_i', op: cmd.children[0].lexeme },
        cmd.children[2], // inclusive_or_expr_p
        cmd.children[1] // exclusive_or_expr
      )
    } else {
      throw new Error('Error [inclusive_or_expr_p]: incorrect number of children')
    }
  },
  init_declarator: (cmd: any) => {
    if (cmd.children.length === 1) {
      const sym_obj = { sym: '' }
      scan_sym(cmd.children[0], sym_obj)
      set_default_value(lookup(sym_obj.sym, E), M)
    } else if (cmd.children.length === 3) {
      // int x = 0;
      push(
        A,
        { title: 'assmt_i', op: '=' },
        cmd.children[2], // initializer -> expr (2)
        cmd.children[0] // declarator -> sym
      )
      push(S, { marker: 'assmt_marker' })
    } else {
      throw new Error('Error [init_declarator]: incorrect number of children')
    }
  },
  init_declarator_list: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // init_declarator_list_p
        cmd.children[0] // init_declarator
      )
    } else {
      throw new Error('Error [init_declarator_list]: incorrect number of children')
    }
  },
  init_declarator_list_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[2], // init_declarator_list_p
        cmd.children[1] // init_declarator
      )
    } else {
      throw new Error('Error [init_declarator_list_p]: incorrect number of children')
    }
  },
  initializer: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // assignment_expr
    } else if (cmd.children.length === 3 || cmd.children.length === 4) {
      push(A, cmd.children[1]) // initializer_list
    } else {
      throw new Error('Error [initializer]: incorrect number of children')
    }
  },
  initializer_list: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // initializer_list_p
        cmd.children[0] // initializer
      )
    } else if (cmd.children.length === 3) {
      push(
        A,
        cmd.children[2], // initializer_list_p
        cmd.children[1], // initializer
        cmd.children[0] // designation
      )
    } else {
      throw new Error('Error [initializer_list]: incorrect number of children')
    }
  },
  initializer_list_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // Epsilon
    } else if (cmd.children.length === 3) {
      push(
        A,
        cmd.children[2], // initializer_list_p
        cmd.children[1] // initializer
      )
    } else if (cmd.children.length === 4) {
      push(
        A,
        cmd.children[3], // initializer_list_p
        cmd.children[2], // initializer
        cmd.children[1] // designation
      )
    } else {
      throw new Error('Error [initialiser_list_p]: incorrect number of children')
    }
  },
  iteration_stmt: (cmd: any) => {
    switch (cmd.children[0].tokenClass) {
      case 'WHILE':
        push(S, {
          value: undefined,
          type: DataType.VOID,
          size: 1,
          pointer_count: NULL_POINTER_COUNT
        })
        push(
          A,
          { title: 'while_i', pred: cmd.children[2], body: cmd.children[4] }, // body: compound_stmt -> will extend_env
          cmd.children[2] // expr (predicate)
        )
        break
      case 'FOR':
        push(S, {
          value: undefined,
          type: DataType.VOID,
          size: 1,
          pointer_count: NULL_POINTER_COUNT
        })
        const E_parent = E
        extend_environment(cmd, E) // TODO: Compress 2 frames into 1 frame
        push(
          A,
          { title: 'env_i', env: E_parent },
          { title: 'for_i', pred: cmd.children[3], iter: cmd.children[4], body: cmd.children[6] },
          cmd.children[3]
        )
        break
    }
  },
  jump_stmt: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(A, { title: 'jump_stmt_i', type: cmd.children[0].lexeme })
    } // return expr;
    else if (cmd.children.length === 3) {
      push(A, { title: 'jump_stmt_i', type: 'return_expr' }, cmd.children[1])
    } else {
      throw new Error('Error [jump_stmt]: incorrect number of children')
    }
  },
  // labeled_stmt
  logical_and_expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // logical_and_expr_p
        cmd.children[0] // inclusive_or_expr
      )
    } else {
      throw new Error('Error [logical_and_expr]: incorrect number of children')
    }
  },
  logical_and_expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (cmd.children.length === 3) {
      push(
        A,
        { title: 'binop_i', op: cmd.children[0].lexeme },
        cmd.children[2], // logical_and_expr_p
        cmd.children[1] // inclusive_or_expr
      )
    } else {
      throw new Error('Error [logical_and_expr_p]: incorrect number of children')
    }
  },
  logical_or_expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // logical_or_expr_p
        cmd.children[0] // logical_and_expr
      )
    } else {
      throw new Error('Error [logical_or_expr]: incorrect number of children')
    }
  },
  logical_or_expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (cmd.children.length === 3) {
      push(
        A,
        { title: 'binop_i', op: cmd.children[0].lexeme },
        cmd.children[2], // logical_or_expr_p
        cmd.children[1] // logical_and_expr
      )
    } else {
      throw new Error('Error [logical_or_expr_p]: incorrect number of children')
    }
  },
  multiplicative_expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // multiplicative_expr_p
        cmd.children[0] // cast_expr
      )
    } else {
      throw new Error('Error [multiplicative_expr]: incorrect number of children')
    }
  },
  multiplicative_expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (cmd.children.length === 3) {
      push(
        A,
        { title: 'binop_i', op: cmd.children[0].lexeme },
        cmd.children[2], // multiplicative_expr_p
        cmd.children[1] // cast_expr
      )
    } else {
      throw new Error('Error [multiplicative_expr_p]: incorrect number of children')
    }
  },
  parameter_declaration: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // declaration_specifiers
    } else if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // declarator // David's interesting comment -> Pointer (Dont push, useless)
        cmd.children[0] // declaration_specifiers
      )
    } else {
      throw new Error('Error [parameter declaration]: incorrect number of children')
    }
  },
  parameter_type_list: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // parameter_list
    } else {
      throw new Error('Error [parameter_type_list]: incorrect number of children')
    }
  },
  parameter_list: (cmd: any) => {
    push(
      A,
      cmd.children[1], // parameter_list_p
      cmd.children[0] // parameter_declaration
    )
  },
  parameter_list_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (cmd.children.length === 3) {
      push(
        A,
        cmd.children[2], // parameter_list_p
        cmd.children[1] // parameter_declaration
      )
    } else {
      throw new Error('Error [postfix_expr]: incorrect number of children')
    }
  },
  pointer: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(A, cmd.children[1]) // pointer | type_qualifier_list
    } else if (cmd.children.length === 3) {
      push(
        A,
        cmd.children[2], // pointer
        cmd.children[1] // type_qualifier_list
      )
    } else if (cmd.children.length === 1) {
    } else {
      throw new Error('Error [pointer]: incorrect number of children')
    }
  },
  postfix_expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // postfix_expr_p
        cmd.children[0] // primary_expr
      )
    } else {
      throw new Error('Error [postfix_expr]: incorrect number of children')
    }
  },
  postfix_expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // EPSILON
    } else if (cmd.children.length === 2) {
      const primary_expr_sym = S.pop()
      push(S, { marker: 'assmt_marker' }, primary_expr_sym, primary_expr_sym)
      push(
        A,
        { title: 'assmt_i', op: '=' },
        { title: 'unop_i', op: cmd.children[0].lexeme } // INC_OP | DEC_OP
      )
    } else if (cmd.children.length === 3) {
      switch (cmd.children[0].tokenClass) {
        case '(':
          push(A, { title: 'function_app_i', arity: 0 })
          break
        case 'PTR_OP': //PTR_OP IDENTIFIER postfix_expr_p
        // TODO: PTR OP
      }
    } else if (cmd.children.length === 4) {
      switch (cmd.children[0].tokenClass) {
        case '[':
          push(A, cmd.children[3], { title: 'array_pos_i' }, cmd.children[1])
          break
        case '(':
          const result = { count: 0 }
          count_parameters(cmd.children[1], result)
          push(A, { title: 'function_app_i', arity: result.count }, cmd.children[1]) // argument_expression_list
          break
      }
    } else {
      throw new Error('postfix expr error')
    }
  },
  primary_expr: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(S, convert_lexeme_to_data(cmd.children[0]))
    } else if (cmd.children.length === 3) {
      push(A, cmd.children[1]) // expr
    } else {
      throw new Error('Error [primary_expr]: incorrect number of children')
    }
  },
  relational_expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // relational_expr_p
        cmd.children[0] // shift_expr
      )
    } else {
      throw new Error('Error [relational_expr]: incorrect number of children')
    }
  },
  relational_expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0])
    } else if (cmd.children.length === 3) {
      push(
        A,
        { title: 'binop_i', op: cmd.children[0].lexeme },
        cmd.children[2], // relational_expr_p
        cmd.children[1] // shift_expr
      )
    } else {
      throw new Error('Error [relational_expr_p]: incorrect number of children')
    }
  },
  selection_stmt: (cmd: any) => {
    if (cmd.children.length === 5) {
      if (cmd.children[0].tokenClass === 'IF') {
        push(
          A,
          { title: 'branch_i', cond: cmd.children[4], alt: { title: 'push_null_i' } },
          cmd.children[2] // expr
        )
      } else {
        throw new Error('Error [selection_stmt]: Switch case feature not implemented')
      }
    } else if (cmd.children.length === 7) {
      push(
        A,
        { title: 'branch_i', cond: cmd.children[4], alt: cmd.children[6] },
        cmd.children[2] // expr
      )
    } else {
      throw new Error('Error [selection_stmt]: incorrect number of children')
    }
  },
  shift_expr: (cmd: any) => {
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // shift_expr_p
        cmd.children[0] // additive_expr
      )
    } else {
      throw new Error('Error [shift_expr]: incorrect number of children')
    }
  },
  shift_expr_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0])
    } else if (cmd.children.length === 3) {
      push(
        A,
        { title: 'binop_i', op: cmd.children[0].lexeme },
        cmd.children[2], // shift_expr_p
        cmd.children[1] // additive_expr
      )
    } else {
      throw new Error('Error [shift_expr_p]: incorrect number of children')
    }
  },
  // specifier_qualifier_list
  stmt: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // compound_stmt|expression_stmt|selection_stmt|iteration_stmt|jump_stmt
    } else {
      throw new Error('Error [stmt]: incorrect number of children')
    }
  },
  // storage_class_specifier
  // struct_declaration
  // struct_declaration_list
  // struct_declaration_list_p
  // struct_declarator
  // struct_declarator_list
  // struct_declarator_list_p
  // struct_or_union
  // struct_or_union_specifier
  translation_unit: (cmd: any) => {
    extend_environment(cmd, E)
    if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // translation_unit_p
        cmd.children[0] // external declaration
      )
    } else {
      throw new Error('Error [translation_unit]: incorrect number of children')
    }
  },
  translation_unit_p: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // Epsilon
    } else if (cmd.children.length === 2) {
      push(
        A,
        cmd.children[1], // translation_unit_p
        cmd.children[0] // external declaration
      )
    } else {
      throw new Error('Error [translation_unit_p]: incorrect number of children')
    }
  },
  // type_name
  type_qualifier: (cmd: any) => { },
  type_qualifier_list: (cmd: any) => {
    if (cmd.children.length == 2) {
      push(
        A,
        cmd.children[1], // type_qualifier_list_p
        cmd.children[0] // type_qualifier
      )
    } else {
      throw new Error('Error [translation_unit_p]: incorrect number of children')
    }
  },
  type_qualifier_list_p: (cmd: any) => {
    if (cmd.children.length == 1) {
      push(A, cmd.children[0]) // EPSILON
    }
    if (cmd.children.length == 2) {
      push(
        A,
        A,
        cmd.children[1], // type_qualifier_list_p
        cmd.children[0] // type_qualifier
      )
    } else {
      throw new Error('Error [translation_unit_p]: incorrect number of children')
    }
  },
  type_specifier: (cmd: any) => {
    if (cmd.children.length === 1 && cmd.children[0].hasOwnProperty('tokenClass')) {
      const type = convert_to_data_type(cmd.children[0].tokenClass)
      const data = {
        value: NULL_VAL,
        type: type,
        size: NULL_SIZE,
        pointer_count: NULL_POINTER_COUNT
      }
      push(S, data)
    } else {
      throw new Error('Error [type_specifier]: incorrect number of children')
    }
  },
  unary_expr: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, cmd.children[0]) // postfix_expr
    } else if (cmd.children.length === 2) {
      if (cmd.children[0].lexeme === 'INC_OP' || cmd.children[0].lexeme === 'DEC_OP') {
        push(
          A, // TODO: x = ++y
          { title: 'unop_i', op: cmd.children[0].lexeme }, // INC_OP | DEC_OP
          cmd.children[1], // unary_expr
          { title: 'assmt_i', op: '=' },
          cmd.children[1], // unary_expr
          { title: 'unop_i', op: cmd.children[0].lexeme }, // INC_OP | DEC_OP
          cmd.children[1] // unary_expr
        )
        push(S, { marker: 'assmt_marker' })
      } else {
        push(
          A,
          { title: 'unop_i', op: get_lexeme(cmd.children[0]) }, // unary_operator
          cmd.children[1] // cast_expr
        )
      }
    } else {
      throw new Error('Error [unary_expr]: incorrect number of children')
    }
  },
  unary_operator: (cmd: any) => {
    if (cmd.children.length === 1) {
      push(A, { title: 'unop_i', op: cmd.children[0].tokenClass })
    } else {
      throw new Error('Error [unary_operator]: incorrect number of children')
    }
  },

  // -------------- Instructions --------------
  push_null_i: () => {
    push(S, {
      value: NULL_VAL,
      type: DataType.VOID,
      size: NULL_SIZE,
      pointer_count: NULL_POINTER_COUNT
    })
  },
  assmt_i: (cmd: any) => {
    const values = []
    while (!(peek(S).hasOwnProperty('marker') && peek(S).marker === 'assmt_marker')) {
      values.push(S.pop())
    }
    S.pop() // pop off assmt_marker
    const sym = values.pop()
    values.reverse()
    const syms = []
    if (values.length > 1) {
      for (let i = 0; i < values.length; i++) {
        syms.push({ ...sym, pos: i })
      }
    } else {
      syms.push(sym)
    }
    if (values.length === 1) {
      switch (cmd.op) {
        case '+=':
          values[0].value = get_sym_value(syms[0]).value + values[0].value
          break
        case '-=':
          values[0].value = get_sym_value(syms[0]).value - values[0].value
          break
        case '*=':
          values[0].value = get_sym_value(syms[0]).value * values[0].value
          break
        case '/=':
          values[0].value = get_sym_value(syms[0]).value / values[0].value
          break
        case '<<':
          values[0].value = get_sym_value(syms[0]).value << values[0].value
          break
        case '>>':
          values[0].value = get_sym_value(syms[0]).value >> values[0].value
          break
        case '^=':
          values[0].value = get_sym_value(syms[0]).value ^ values[0].value
          break
        case '&=':
          values[0].value = get_sym_value(syms[0]).value & values[0].value
          break
        case '|=':
          values[0].value = get_sym_value(syms[0]).value | values[0].value
          break
      }
    }
    assign(syms, values, E)
    if (values.length === 1) {
      push(S, values[0])
    } else {
      push(S, values[values.length - 1]) // TODO: If we assigned an array, what is the last value we push?
    }
  },
  pop_i: () => S.pop(),
  branch_i: (cmd: any) => {
    let pred = S.pop()
    if (pred.type === DataType.IDENTIFIER) {
      pred = M[lookup(pred.value, E)]
    }
    const pred_value = pred.value
    push(A, pred_value ? cmd.cond : cmd.alt)
  },
  env_i: (cmd: any) => {
    if (E != null) {
      s_fptr = E.stack_ptr
      E = cmd.env
    }
  },
  function_assign: (cmd: any) => {
    let params: ScanData[] = []
    while (!peek(S).hasOwnProperty('marker') && peek(S).tag !== 'lambda_assign_marker_i') {
      const arg_name = S.pop() // Data
      const arg_type = S.pop() // Data

      const param = {
        sym: arg_name.value,
        type: arg_type.type,
        size: 1,
        is_stack: true,
        is_function: false,
        pointer_count: 0
      }
      params.push(param)
    }
    S.pop() // pop marker
    const fn_name = params[params.length - 1].sym // function identifier
    const fn_return_type = params[params.length - 1].type // function return type
    params = params.slice(0, params.length - 1)
    if (E != null) {
      const curr_env_capture = E
      E.env[fn_name] = {
        title: 'closure',
        return_type: fn_return_type,
        arity: params.length,
        params: params, // ScanData[]
        comp: cmd.comp,
        env: curr_env_capture  // TODO: Remove environment from closure 
      }
    } else {
      throw new Error('Error [Environment is null]')
    }
  },
  function_app_i: (cmd: any) => {
    const function_call_arity = cmd.arity
    const args: Data[] = []

    for (let i = 0; i < function_call_arity; i++) {
      args.push(S.pop())
    }
    const function_name = S.pop()
    if (builtin_mapping.hasOwnProperty(function_name.value)) {
      push(S, apply_builtin(function_name.value, args)) // pass in arity
    } else {
      const closure = lookup(function_name.value, E)
      if (closure.arity !== function_call_arity) throw new Error('Error [arity mismatch]')
      const function_body = closure.comp // compound_statement
      const function_params = closure.params // array we created
      const E_curr = E
      extend_environment(function_body, closure.env) // -> E
      function_params.reverse()
      args.reverse()
      extend_and_assign_params_to_environment(function_params, args)
      if (function_body.children.length === 3) {
        push(
          A,
          { title: 'env_i', env: E_curr },
          { title: 'type_check_i', type: closure.return_type },
          { title: 'mark_i' },
          function_body.children[1]
        )
      } else if (function_body.children.length === 2) {
        push(A, { title: 'env_i', env: E_curr })
      } else {
        throw new Error('Error [function_app_i]: function_body has incorrect number of children')
      }
    }
  },
  reset_i: (cmd: any) => {
    A.pop().title === 'mark_i' ? null : push(A, cmd)
  },
  unop_i: (cmd: any) => {
    push(S, apply_unop(cmd.op, S.pop()))
  },
  binop_i: (cmd: any) => {
    push(S, apply_binop(cmd.op, S.pop(), S.pop()))
  },
  while_i: (cmd: any) => {
    S.pop().value ? push(A, cmd, cmd.pred, { title: 'pop_i' }, cmd.body) : null
  },
  for_i: (cmd: any) => {
    S.pop().value ? push(A, cmd, cmd.pred, cmd.iter, { title: 'pop_i' }, cmd.body) : null
  },
  swap_i: (cmd: any) => {
    if (S.length >= 2) {
      const first = S.pop()
      const second = S.pop()
      S.push(first)
      S.push(second)
    } else {
      throw new Error('Error [swap_i]: Stack shorter than length 2')
    }
  },
  throw_i: (cmd: any) => {
    // TODO:
    const next = A.pop()
    if (next.title === 'catch_i') {
      // catch found?
      const catch_cmd = next // stop loop
      push(A, { title: 'env_i', env: catch_cmd.env }, catch_cmd.catch)
      const E_parent = E
      extend_environment(catch_cmd, E)
      // E = extend([catch_cmd.sym], [S.pop()], catch_cmd.env)
    } else {
      // continue loop by pushing same
      push(A, cmd) // throw_i instruction back on agenda
    }
  },
  jump_stmt_i: (cmd: any) => {
    if (cmd.type === 'continue') {
      const restore_env = { env: '' }
      let curr = peek(A)
      while (curr.hasOwnProperty('title') && curr.title !== 'while_i' && curr.title !== 'for_i') {
        if (curr.title === 'env_i') {
          restore_env.env = curr.env
        }
        A.pop()
        if (peek(A).title === 'while_i') {
          push(A, curr)
          break
        }
        curr = peek(A)
      }
      push(A, { title: 'env_i', env: restore_env.env })
    } else if (cmd.type === 'break') {
      const restore_env = { env: '' }
      let curr = peek(A)
      while (curr.hasOwnProperty('title') && curr.title !== 'while_i' && curr.title !== 'for_i') {
        if (curr.title === 'env_i') {
          restore_env.env = curr.env
        }
        A.pop()
        curr = peek(A)
      }
      A.pop()
      push(A, { title: 'env_i', env: restore_env.env })
    } else if (cmd.type === 'return') {
      while (peek(A).title !== 'mark_i') {
        A.pop()
      }
      A.pop()
    } else if (cmd.type === 'return_expr') {
      while (peek(A).title !== 'mark_i') {
        A.pop()
      }
      A.pop()
      const output = peek(S)
      if (output.hasOwnProperty('is_heap')) {
        S.pop()
        push(S, M[output.value])
      } else if (output.type === DataType.IDENTIFIER) {
        S.pop()
        push(S, get_sym_value(output))
      }
    }
  },
  type_check_i: (cmd: any) => {
    if (cmd.type === DataType.VOID) {
      return
    } else {
      const return_value = peek(S)
      if (return_value.type != cmd.type) {
        throw new Error('Error [Type Check]: Function Return Type Mismatch')
      }
    }
  },
  mark_i: (cmd: any) => { },
  array_pos_i: (cmd: any) => {
    let pos = S.pop()
    if (pos.type === DataType.IDENTIFIER) {
      pos = get_sym_value(pos)
    }
    const sym = S.pop()
    sym.pos = pos.value
    push(S, sym)
  }
}

// -------------------- EXECUTION --------------------
export const execute = (codeText: string) => {
  A = [{ title: 'function_app_i', arity: 0 }, parse(codeText)]
  S = [{ value: 'main', type: 'IDENTIFIER' }]
  E = null
  const STEP_LIMIT = 100000
  let step = 0
  while (step < STEP_LIMIT && A.length > 0) {
    const cmd = A.pop()
    // console.log('YUMING LOG -- cmd:', cmd);
    // console.log("YUMING LOG -- S:", S);
    // console.log("YUMING LOG -- A:", A);
    // console.log("YUMING LOG -- E:", E);
    if (microcode.hasOwnProperty(cmd.title)) {
      microcode[cmd.title](cmd)
    } else {
      throw new Error('Error [Unknown command]: ' + cmd.title)
    }
    step++
  }
  if (step == STEP_LIMIT) {
    throw new Error('Error [Step limit reached]')
  }
  if (S.length != 1) {
    throw new Error('Error [Incorrect S length]: ' + S.length)
  }

  return S[0].value
}
