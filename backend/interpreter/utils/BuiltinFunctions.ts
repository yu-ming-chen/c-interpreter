import { get_sym_value, lookup } from '../cinterpreter'
import { Data, DataType, EnvNode } from './DataTypes'
import { get_data_size } from './HelperFunctions'

export const print_memory = (env: EnvNode | null, M: any): void => {
  const word_size = 8
  const S_SIZE = M.length / 2
  const memory_array = new Array(M.length).fill('X')
  while (env !== null) {
    for (const [key, address] of Object.entries(env.env)) {
      if (typeof address !== 'number') continue
      const possible_heap_ptr = M[address]
      if (possible_heap_ptr.pointer_count > 0 && possible_heap_ptr.value >= S_SIZE) {
        let data_on_heap = M[possible_heap_ptr.value]
        if (data_on_heap === undefined) continue
        const heap_address = possible_heap_ptr.value
        const size = data_on_heap.size * get_data_size(data_on_heap.type)
        for (let i = heap_address; i < heap_address + size; i += word_size) {
          data_on_heap = M[i]
          memory_array[i] = [
            key,
            data_on_heap.type + '*'.repeat(data_on_heap.pointer_count - 1),
            data_on_heap.value != undefined ? data_on_heap.value : 'undefined'
          ]
        }
      }

      let memory_value = M[address]
      const size = memory_value.size * get_data_size(memory_value.type)
      for (let i = address; i < address + size; i += word_size) {
        memory_value = M[i]
        memory_array[i] = [
          key,
          memory_value.type + '*'.repeat(memory_value.pointer_count),
          memory_value.value != undefined ? memory_value.value : 'undefined'
        ]
      }
    }
    env = env.parent
  }
  console.log(' -------------------[STACK]--------------------')
  console.log('| Address    | Symbol   | Type     | Value     |')
  for (let i = 0; i < memory_array.length; i++) {
    if (i === S_SIZE) {
      console.log(' -------------------[HEAP]---------------------')
      console.log('| Address    | Symbol   | Type     | Value     |')
    }
    if (memory_array[i] === 'X') continue
    const address = '0x' + i.toString(16).padStart(8, '0')
    const value = memory_array[i][0].toString().padEnd(8, ' ')
    const type = memory_array[i][1].toString().padEnd(8, ' ')
    const symbol = memory_array[i][2].toString().padEnd(9, ' ')
    console.log(`| ${address} | ${value} | ${type} | ${symbol} |`)
  }
  console.log(' ----------------------------------------------')
}

export const print_env = (env: EnvNode | null): void => {
  while (env !== null) {
    console.log(' ----------[ENV]----------')
    console.log('| Symbol   | Address      | ')
    for (const [key, value] of Object.entries(env.env)) {
      if (typeof value !== 'number') {
        const sym = key.padEnd(8, ' ')
        const closure = '<closure>'.padEnd(13, ' ')
        console.log(`| ${sym} | ${closure}|`)
      } else {
        const sym = key.padEnd(8, ' ')
        const address = '0x' + value.toString(16).padStart(8, '0').padEnd(11, ' ')
        console.log(`| ${sym} | ${address}|`)
      }
    }
    console.log(' -------------------------')
    if (env.parent !== null) {
      console.log('   |')
      console.log('   |')
      console.log('   ↓')
    }
    env = env.parent
  }
}

// FUTURE EXTENTION
// export const printf = (format: string, ...args: any[]): void => {
//   let i = 0;
//   const regex = /%[sdf]/g;
//   const formatted = format.replace(regex, (match) => {
//     const arg = args[i++];
//     switch (match) {
//       case "%s":
//         return String(arg);
//       case "%d":
//         return String(parseInt(arg, 10));
//       case "%f":
//         return String(parseFloat(arg));
//       default:
//         return match;
//     }
//   });

//   console.log(formatted);
// }

export const printf = (E: any, M: any, ...args: Data[]): void => {
  let formatted = ''
  args = args.reverse()
  for (let i = 0; i < args.length; i++) {
    let data = args[i]
    if (data.type == DataType.IDENTIFIER) {
      data = get_sym_value(data)
    }
    if (data.size! <= 1) {
      formatted += data.value
    }
    if (data.size! > 1) {
      formatted += '['
      for (let j = 0; j < data.size!; j++) {
        const address = lookup(args[i].value, E)
        data = M[address + j * get_data_size(data.type)]
        switch (data.type) {
          case DataType.CHAR:
            formatted += String(data.value)
            break
          case DataType.INT:
            formatted += String(data.value)
            break
          case DataType.DOUBLE:
            formatted += String(data.value)
            break
        }
        if (j != data.size! - 1) formatted += ', '
      }
      formatted += ']'
    }
    if (i != args.length - 1) {
      formatted += ', '
    }
  }
  console.log(formatted)
}
