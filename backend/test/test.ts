import { execute } from '../interpreter/cinterpreter'

const test = (code_text: string, expected_result: any) => {
  let result = undefined
  let check = undefined
  try {
    result = execute(code_text)
  } catch (error) {
    check = error.message === expected_result.message
    return check
  }
  check = result === expected_result
  return check
}

type TestData = [string, any][]

const tests: TestData = [
  // Basic main function
  [
    `int main() { 
        return 0; 
    }`,
    0
  ],

  // Step limit reached
  [
    `int f() {
        return f();
    }
    
    int main() {
        return f();
    }`,
    Error('Error [Step limit reached]')
  ],

  // Stack overflow
  [
    `int f() {
        int arr[100] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
        return f();
    }
    
    int main() {
        return f();
    }`,
    Error('Error [Stack overflow]')
  ],

  // Fibonacci 10
  [
    `int fib(int x) {
        if(x <= 1) return x;
        return fib(x - 1) + fib(x - 2);
    }
    
    int main() {
        return fib(10);
    }`,
    55
  ],

  // While loop
  [
    `int f(int x, int y) {
      return x * y;
    }
    int main() {   
      int y = 5;
      while(y < 10){
          y++;
      }
      return y + f(4,6);
    }`, 34
  ],

  // While loop: continue
  [
    `int main() {
      int x = 0;
      int y = 0;
      while(x < 10) {
          x++;
          if(x == 5) continue;
          y++;
      }
      return y;
  }`, 9
  ],

  // If else
  [
    `int main() {
      int x = 5;
      int y = 8;
      if(x <= 1) {
          int x = 5;
          int y = 11;
          return x;
      } else {
          int x = 10;
          return y;
      }
      return x;
  }`, 8
  ],

  // Arrays
  [`int main() {
    int arr[5] = {1, 2, 3, 4, 5};
    int size = 5;
    int i = 0;

    while(i < size) {
        arr[i]++;
        i++;
    }
    return arr[4];
}`, 6],

  // Pointers
  [`int main()
  {
      int x = 5;
      int *ptr = &x;
      int **ptr2 = &ptr;
      *ptr = 10;
      return **ptr2 * **ptr2;
  }`, 100],

  // Pointers: array
  [`int main()
  {
      int arr[3] = {1, 2, 3};
      int *ptr = &arr[1];
      *ptr = 3;
      return arr[1];
  }`, 3],

  // Malloc & Free
  [`int main()
  {
      int x = 5;
      int *ptr = malloc(8);
      *ptr = 7;
      int y = x + *ptr;
      free(ptr);
      return y;
  }`, 12],

  // Use after free
  [`int main()
  {
      int x = 5;
      int *ptr = malloc(8);
      *ptr = 7;
      int y = x + *ptr;
      free(ptr);
      return *ptr;
  }`, Error('Error [Use After Free]: ptr')]


]

tests.forEach((curr, index) => {
  console.log('Test', String(index + 1), ':', test(curr[0], curr[1]) ? 'Passed' : 'Failed')
})
