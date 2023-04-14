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
  // 1 unit test: Step limit reached
  [
    `int f() {
        return f();
    }
    
    int main() {
        return f();
    }`,
    Error('Error [Step limit reached]')
  ],

  // 2 unit test: Stack overflow
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
  
  /*---------- IF ELSE ------------------------*/

  // 3 unit test: if block -> 5
  [`int main() {
      int x = 0;
      if(1) x += 1;
      if(1) x += 1;
      if(1) x += 1;
      if(1) x += 1;
      if(1) x += 1;
      if(0) x += 1; // do not add
      return x;
    }`, 5],

  // 4 unit test: else if block -> 2
  [`int main() {
      int x = 0;
  	  if(0) {
        x += 1;
      } else if (1) {
        x += 2;
      } else {
        x += 3;
      }
      return x;
    }`, 2],

  // 5 unit test: else block -> 3
  [`int main() {
      int x = 0;
  	  if(0) {
        x += 1;
      } else if (0) {
        x += 2;
      } else {
        x += 3;
      }
      return x;
    }`, 3],

  // 6 unit test: if else
  [`int main() {
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
    }`, 8],

  // 7 integration test: if else and array
  [`int main() {
      int arr[5] = {1, 2, 3, 4, 5};
      if(1) {
        arr[0] = 100;
      } else {
        arr[0] = 200;
      }
      return arr[0];
    }`, 100],

  // 8 integration test: if else and malloc
  [`int main() {
      int *ptr = malloc(8);
      if(1) {
        *ptr = 100;
      } else {
        *ptr = 200;
      }
      int x = *ptr;
      free(ptr);
      return x;
    }`, 100],

  // 9 integration test: if else and function
  [`int f(int x) {
      return x + 1;
    }
    int main() {
      int x = 5;
      if(0) {
        x = f(x);
      } else {
        x = f(x) + 1;
      }
      return x;
    }`, 7],

  /*------------------ WHILE ------------------------*/
  // 10 unit test: while loop -> 5
  [`int main() {
      int x = 0;
      while(x < 5) {
        x++;
      }
      return x;
    }`, 5],

  // 11 unit test: while loop with break -> 1
  [`int main() {
      int x = 0;
      while(x < 5) {
        x++;
        break;
      }
      return x;
    }`, 1],

  // 12 unit test: while loop with continue -> 4
  [`int main() {
      int x = 0;
      int i = 0;
      while(i < 5) {
        i++;
        if(i == 2) continue;
        x++;
      }
      return x;
    }`, 4],

  // 13 unit test: While loop
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

  // 14 unite test: While loop: continue
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

  // 15 integration test: while loop with function call -> 50
  [`int f(int a, int b) {
     return a * b;
    }

    int main() {
      int x = 0;
      int i = 0;
      while(i < 5) {
        x += f(2, 5);
            i++;
      }
      return x;
    }`, 50],

  // 16 integration test: while loop with array -> 50
  [`int main() {
      int arr[5] = {1, 2, 3, 4, 5};
      int i = 0;
      while(i < 5) {
        arr[i] *= 10;
            i++;
      }
      return arr[4];
    }`, 50],

  // 17 integration test: while loop with malloc and free -> 50
  [`int main() {
      int x = 0;
      int i = 0;
      while(i < 5) {
        int *ptr = malloc(8);
        *ptr = 10;
        x = x + *ptr; // TODO: change to x += *ptr
        free(ptr);
        i++;
      }
      return x;
    }`, 50],

  /*------------------ MALLOC & FREE ---------------*/

  // 18 unit test: malloc & free
  [`int main() {
      int *ptr = malloc(8);
      *ptr = 10;
      int x = *ptr;
      free(ptr);
      return x;
    }`, 10],
  
  // 19 unit test: malloc & Free
  [`int main()
  {
      int x = 5;
      int *ptr = malloc(8);
      *ptr = 7;
      int y = x + *ptr;
      free(ptr);
      return y;
  }`, 12],

   // 20 unit test: malloc & stack pointer
   [`int main() {
    int *ptr = malloc(8);
    int x = 10;
    int *sptr = &x;
    *sptr = 20;
    *ptr = x;
    free(ptr);
    return x;
    }`, 20],

// 21 unit test: Use after free
  [`int main()
  {
      int x = 5;
      int *ptr = malloc(8);
      *ptr = 7;
      int y = x + *ptr;
      free(ptr);
      return *ptr;
  }`, Error('Error [Use After Free]: ptr')],

  // 22 unit test: malloc array
  [`int main() {
      int *ptr = malloc(8 * 5);
      ptr[0] = 10;
      ptr[1] = 20;
      ptr[2] = 30;
      ptr[3] = 40;
      ptr[4] = 50;
      int x = ptr[0] + ptr[1] + ptr[2] + ptr[3] + ptr[4];
      free(ptr);
      return x;
    }`, 150],
  
  // 23 integration test: malloc array and function call
  [`int f(int a, int b) {
      return a * b;
    }

    int main() {
      int *ptr = malloc(8 * 5);
      ptr[0] = 10;
      ptr[1] = 20;
      ptr[2] = 30;
      ptr[3] = 40;
      ptr[4] = 50;
      int x = f(ptr[0], ptr[1]) + f(ptr[2], ptr[3]) + f(ptr[4], ptr[0]);
      free(ptr);
      return x;
    }`, 1900],

  // 24 integration test: malloc array and while loop
  [`int main() {
      int *ptr = malloc(8 * 5);
      ptr[0] = 10;
      ptr[1] = 20;
      ptr[2] = 30;
      ptr[3] = 40;
      ptr[4] = 50;
      int i = 0;
      while(i < 5) {
        ptr[i] *= 10;
        i++;
      }
      int x = ptr[0] + ptr[1] + ptr[2] + ptr[3] + ptr[4];
      free(ptr);
      return x;
    }`, 1500],
  
  // 25 integration test: malloc array and if statement
  [`int main() {
      int *ptr = malloc(8 * 5);
      ptr[0] = 10;
      ptr[1] = 20;
      ptr[2] = 30;
      ptr[3] = 40;
      ptr[4] = 50;
      if(ptr[0] < 11) {
        ptr[0] *= 10;
      }
      int x = ptr[0] + ptr[1] + ptr[2] + ptr[3] + ptr[4];
      free(ptr);
      return x;
    }`, 240],


  
  /*------------------ FUNCTION ---------------*/

  // 26 unit test: function call Basic main function
  [
    `int main() { 
        return 0; 
    }`,
    0
  ],

  // 27 unit test: multiple function
  [`int f() {
      return 1;
    }

    int main() { 
        return 0; 
    }`,
    0],

  // 28 unit test: multiple function, function call
  [`int f() {
      return 1;
    }

    int main() { 
        return f(); 
    }`,
  1],
  
  // 29 integration test: function call binop
  [`int f(int a, int b) {
      return a * b;
    }

    int main() {
      return f(2, 5);
    }`, 10],

  // 30 integration test: function call unop
  [`int f(int a) {
      return !a;
    }

    int main() {
      return f(1);
    }`, 0],

  // 31 unit test: recursive function call Fib 10
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
  
  /*------------------ARRAY ---------------*/
  // 32 Initialise to default value 
  [`int main() 
  {
    int arr[3]; 
    return arr[0]; 
  }`, 0],


  // 33 Array value reassignment 
  [`int main() 
  {
    int arr[3] = {1,2,3}; 
    arr[0] += 10; 
    return arr[0]; 
  }`, 11],

  // 34 Array with conditionals 1
  [`int main() 
  {
    int arr[3] = {1,2,3}; 

    if (1) { 
      arr[1] -= 5; 
    } else { 
      arr[1] += 5; 
    }
    
    return arr[1]; 
  }`, -3],

  // 35 Array with while loops 
  [`int main() 
  {
    int arr[3] = {1,2,3}; 
    int i = 0; 
    while (i < 3) { 
      arr[i] += 3;
      i++;
    }
    int result = arr[0] + arr[1] + arr[2]; 
    return result; 
  }`, 15],

  // 36 Array with for loops 
  [`int main() 
  {
    int arr[3] = {1,2,3}; 
    int i = 0; 

    for (int i = 0; i < 3; i++) { 
      arr[i] += 3; 
    }
    int result = arr[0] + arr[1] + arr[2]; 
    return result; 
  }`, 15],

  // 37 Array with [] + binop  
  [`int main() 
  {
    int arr[3] = {1,2,3}; 
    int result = arr[0] + arr[2]; 
    result -= arr[1]; 
    return result; 
  }`, 2],

  // 38 Array with pointers 
  [`int main()
  {
      int arr[3] = {1, 2, 3};
      int *ptr = &arr[1];
      *ptr = 10;
      return arr[1];
  }`, 10],

  // 39 Array with different data types 
  [`char main()
  {
      char arr[5] = {'h', 'e', 'l', 'l', 'o'};
      return arr[0]; 
  }`, "\'h\'"],

  // 40
  [`double main()
  {
      double arr[3] = {-1.0, -2.0, -3.0};
      return arr[0] + arr[2]; 
  }`, -4.0],

  /*---------------- PTR ---------------------*/
  // 41 Pointer single pointer
  [`int main()
  {
      int x = 5;
      int *ptr = &x;
      return x;
  }`, 5],
  
  // 42 Pointer single pointer, error assignment to non address
  [`int main()
  {
      int x = 5;
      int *ptr = x;
      return x;
  }`, Error('Error [Assign - Different pointer count]')],
  
  // 43 Pointer single pointer, dereference
  [`int main()
  {
      int x = 5;
      int *ptr = &x;
      return *ptr;
  }`, 5],

  // 44 Pointer single pointer, default values
  [`int main()
  {
      int x;
      int *ptr = &x;
      return *ptr;
  }`, 0],

  // 45 Pointer single pointer, dereference assignment
  [`int main()
  {
      int x = 5;
      int *ptr = &x;
      int y = *ptr;
      return y;
  }`, 5],

  // 46 Pointer multiple single pointer, addition
  [`int main()
  {
      int x = 5;
      int *ptr1 = &x;
      int y = 6;
      int *ptr2 = &y;
      return x + y;
  }`, 11],

  // 47 Pointer multiple single pointer, dereference addition
  [`int main()
  {
      int x = 5;
      int *ptr1 = &x;
      int y = 6;
      int *ptr2 = &y;
      return *ptr1 + *ptr2;
  }`, 11],

  // 48 Pointer multiple single pointer, same address, dereference addition
  [`int main()
  {
      int x = 5;
      int *ptr1 = &x;
      int *ptr2 = &x;
      return *ptr1 + *ptr2;
  }`, 10],

  // 49 Pointer multiple single pointer, same address, modification, dereferenc multiplication
  [`int main()
  {
      int x = 5;
      int *ptr1 = &x;
      int *ptr2 = &x;
      *ptr2 = 6;
      return *ptr1 * *ptr2;
  }`, 36],

  // 50 Pointer double pointer
  [`int main()
  {
      int x = 5;
      int *ptr = &x;
      int **ptr2 = &ptr;
      return x;
  }`, 5],

  // 51 Pointer double pointer, Assignment error with wrong nesting
  [`int main()
  {
      int x = 5;
      int *ptr = &x;
      int **ptr2 = &x;
      return x;
  }`, Error('Error [Assign - Different pointer count]')],
  
  // 52 Pointer double nested pointer, single dereference assignment
  [`int main()
  {
      int x = 5;
      int *ptr = &x;
      int **ptr2 = &ptr;
      *ptr = 10;
      return *ptr;
  }`, 10],

  // 53 Pointer double nested pointer, single dereference assignment, multiplication
  [`int main()
  {
      int x = 5;
      int *ptr = &x;
      int **ptr2 = &ptr;
      *ptr = 10;
      return *ptr * *ptr;
  }`, 100],

  // 54 Pointer double nested pointer, double dereference
  [`int main()
  {
      int x = 5;
      int *ptr = &x;
      int **ptr2 = &ptr;
      **ptr2 = 10;
      return **ptr2;
  }`, 10],

  // 55 Pointer double nested pointer, double dereference, initial variable
  [`int main()
  {
      int x = 5;
      int *ptr = &x;
      int **ptr2 = &ptr;
      **ptr2 = 10;
      return x;
  }`, 10],

  // 56 Pointer triple nested pointer, triple dereference
  [`int main()
  {
      int x = 5;
      int *ptr = &x;
      int **ptr2 = &ptr;
      int ***ptr3 = &ptr2;
      return ***ptr3;
  }`, 5],

  // 57 Pointers and array integration
  [`int main()
  {
      int arr[3] = {1, 2, 3};
      int *ptr = &arr[1];
      *ptr = 3;
      return arr[1];
  }`, 3],
  
  // -------------------- BINOP -------------------------// 
  // 58 + 
  [`int main()
  {
      int x = 2;
      int y = 1; 
      return x + y; 
  }`, 3],

  // 59 -
  [`int main()
  {
      int x = 2;
      int y = 1; 
      return x - y; 
  }`, 1],

  // 60 *
  [`int main()
  {
      int x = 2;
      int y = 3; 
      return x * y; 
  }`, 6],

  // 61 / - divide 
  [`int main()
  {
      int x = 3;
      int y = 2; 
      return x / y; 
  }`, 1],

  // 62 %  
  [`int main()
  {
      int x = 3;
      int y = 2; 
      return x % y; 
  }`, 1],

  // 63 ^  
  [`int main()
  {
      int x = 5;
      int y = 3; 
      return x ^ y; 
  }`, 6],

  // 64 <<  
  [`int main()
  {
      int x = 3;
      int y = 2; 
      return x << y; 
  }`, 12],

  // 65 &   
  [`int main()
  {
      int x = 3;
      int y = 5; 
      return x & y; 
  }`, 1],

  // 66 <  
  [`int main()
  {
      int x = 3;
      int y = 5; 

      if (x < y) { 
        return 1; 
      } else { 
        return 0;
      }
  }`, 1],

  // 67 >  
  [`int main()
  {
      int x = 3;
      int y = 5; 
      if (x > y) { 
        return 1; 
      } 
      return 0;
  }`, 0],

  // 68 ==   
  [`int main()
  {
      int x = 3;
      int y = 3; 
      if (x == y) { 
        return 1; 
      } 
      return 0; 
  }`, 1],

  // 69 <=  
  [`int main()
  {
      int x = 3;
      int y = 3; 
      if (x <= y) { 
        return 1; 
      } 
      return 0; 
  }`, 1],

  // 70 <=   
  [`int main()
  {
      int x = 2;
      int y = 3; 
      if (x <= y) { 
        return 1; 
      } 
      return 0; 
  }`, 1],

  // 71 <=
  [`int main()
  {
      int x = 3;
      int y = 3; 
      if (x >= y) { 
        return 1; 
      } 
      return 0; 
  }`, 1],

  // 72
  [`int main()
  {
      int x = 4;
      int y = 3; 
      if (x >= y) { 
        return 1; 
      } 
      return 0; 
  }`, 1],

  // 73
  [`int main()
  {
    if (1 && 1) { 
      return 1; 
    } 
    return 0; 
  }`, 1],

  // 74
  [`int main()
  {
    if (1 && 0) { 
      return 1; 
    } 
    return 0; 
  }`, 0],

  // 75 
  [`int main()
  {
    if (1 || 0) { 
      return 1; 
    } 
    return 0; 
  }`, 1],

  // 76
  [`int main()
  {
    if (0 || 0) { 
      return 1; 
    } 
    return 0; 
  }`, 0],

  // -------------------- UNOP -------------------------// 
  // 77 unop address, first address
  [`int main()
  {
      int x = 5;
      return &x;
  }`, 0],

  // 78 unop address, first address, mutliple declaration
  [`int main()
  {
      int x = 5;
      int y = 1;
      return &x;
  }`, 0],
  
  // 79 unop address, second address, mutliple declaration
  [`int main()
  {
      int x = 5;
      int y = 1;
      return &y;
  }`, 8],
  
  // 80 unop increment, single
  [`int main()
  {
      int x = 5;
      x++;
      return x;
  }`, 6],
  
  // 81 unop increment, multiple increment
  [`int main()
  {
      int x = 5;
      x++;
      x++;
      return x;
  }`, 7],
  
  // 82 unop increment, assignment
  [`int main()
  {
      int x = 5;
      int y = x++;
      return y;
  }`, 5],

  // 83 unop increment, assignment
    [`int main()
    {
        int x = 5;
        int y = ++x;
        return y;
    }`, 6],

  // 84 unop decrement
  [`int main()
  {
      int x = 5;
      x--;
      return x;
  }`, 4],
  

  // 85 unop decrement, multiple decrement
  [`int main()
  {
      int x = 5;
      x--;
      x--;
      return x;
  }`, 3],

  // 86 Unop decrement, 0 to negative
  [`int main()
  {
      int x = 0;
      x--;
      return x;
  }`, -1],

  // 87 unop decrement, assignment
  [`int main()
  {
      int x = 5;
      int y = x--;
      return y;
  }`, 5],

  // 88 unop decrement, assignment
  [`int main()
  {
      int x = 5;
      int y = --x;
      return y;
  }`, 4],

  // 89 unop not, 1 to 0
  [`int main()
  {
      int x = 1;
      return !x;
  }`, 0],

  // 90 unop not, 0 to 1
  [`int main()
  {
      int x = 0;
      return !x;
  }`, 1],

  // 91 unop not, number to 0
  [`int main()
  {
      int x = 5;
      return !x;
  }`, 0],

  // 92 unop negative
  [`int main()
  {
      return -1;
  }`, -1],

  // 93 unop negative variable
  [`int main()
  {
      int x = 5;
      return -x;
  }`, -5],

  // 94 unop negative assignment
  [`int main()
  {
      int x = 5;
      x = -x;
      return x;
  }`, -5],

  // 95 unop negative double negation
  [`int main()
  {
      int x = 5;
      x = -x;
      x = -x;
      return x;
  }`, 5],

  // 96 unop negative assignment and addition
  [`int main()
  {
      int x = 5;
      x = -x;
      return x + 2;
  }`, -3],
  // 97 for loop
  [`int main()
  {
      int x = 0;
      for (int i = 0; i < 5; i++) {
        x++;
      }
      return x;
  }`, 5],
  
  // 98 for loop with continue
  [`int main()
  {
      int x = 0;
      for (int i = 0; i < 5; i++) {
        x++;
        if (i == 3) continue;
      }
      return x;
  }`, 4],

  // 99 for loop with break
  [`int main()
  {
      int x = 0;
      for (int i = 0; i < 5; i++) {
        x += i;
        if (i == 3) break;
      }
      return x;
  }`, 6],

  // 100 ternary operator evaluate to true
  [`int main()
  {
      int x = 2; 
      int y = 3; 
      return x < y ? 1 : 0; 
  }`, 1],

  // 101 ternary operator evaluate to false
  [`int main()
  {
      int x = 3; 
      int y = 2; 
      return x < y ? 1 : 0; 
  }`, 0]
]

tests.forEach((curr, index) => {
  console.log('Test', String(index + 1), ':', test(curr[0], curr[1]) ? 'Passed' : 'Failed')
})
