// * --------Environment --------*
export class EnvNode {
  public parent: EnvNode | null
  public env: any
  public stack_ptr: number
  constructor(parent: EnvNode | null, env: any, stack_ptr: number) {
    this.parent = parent
    this.env = env
    this.stack_ptr = stack_ptr
  }
}

export type LinkedListData = {
  address: number
  size: number
  is_occupied: boolean
}

export type LinkedListNode = {
  head: LinkedListData
  tail: LinkedListNode | null
}

export enum DataType {
  VOID = 'VOID',
  CHAR = 'CHAR',
  INT = 'INT',
  DOUBLE = 'DOUBLE',
  IDENTIFIER = 'IDENTIFIER'
}

export const DataSize = {
  CHAR: 8,
  INT: 8,
  DOUBLE: 8
}

export type Data = {
  value: any | undefined
  type: DataType
  size: number | undefined
  pointer_count: number
  pos: number
}

export type ScanData = {
  sym: string
  type: DataType
  size: number
  is_stack: boolean
  is_function: boolean
  pointer_count: number
}
