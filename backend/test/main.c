/* Test: Step limit exceeded */

// int main()
// {
//     return main();
// }

/*-----------------------------------------------*/
/* Test: Stack over flow */

// int main() {
//     int arr[100] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//                     1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//                     1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//                     1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//                     1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//                     1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//                     1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//                     1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//                     1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//                     1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
//     return main();
// }

/*-----------------------------------------------*/
/* Test: Fib 10 -> 55 */ 

// int fib(int x) {
//     if(x <= 1) return x;
//     return fib(x - 1) + fib(x - 2);

// }

// int main()
// {
//     return fib(10);
// }

/*-----------------------------------------------*/
/* Test: While loop: break -> 5 */

// int main() {
//     int x = 0;
//     while(x < 10) {
//         x++;
//         if(x == 5) break;
//     }
//     return x;
// }

/*-----------------------------------------------*/
/* Test: If else -> 1 */

// int main() {
//     int x = 1;
//     int y = 2;
//     if(x) return x;
//     else return y;
//     return x;
// }

/*-----------------------------------------------*/
/* Test: Print memory */

// int f(int z) {
//     print_memory(); // -> 2
//     return z * 5;
// }

// int main()
// {
//     int x = 5;
//     while(x < 10){
//         x++;
//     }
//     int *ptr = malloc(8);
//     print_memory(); // -> 1
//     int y = x + f(4);
//     *ptr = 7;
//     print_memory(); // -> 3
//     return x + y;
// }

/*-----------------------------------------------*/
/* Test: Print Env */

// int main() {
//     int x = 1;
//     int y = 1;
//     if(x == 1) {
//         int a = 10;
//         int b = 11;
//         print_env(); // 1
//         print_memory();
//         if(y == 1) {
//             int c = 10;
//             int d = 11;
//             print_env(); // 2
//             print_memory();
//         }
//     }
//     return x;
// }

/*-----------------------------------------------*/
/* Test: Printf */

// int f(int x, int y) {
//     return x * y;
// }

// int main() {
//     int x = 20;
//     printf(f(2,4), x);
//     int arr[5] = {1,2,3,4,5};
//     printf(arr, 5);
//     return 0;
// }

/*-----------------------------------------------*/
/* Test: Arrays */

// int main() {
//     int arr[5] = {1, 2, 3, 4, 5};
//     int size = 5;
//     int i = 0;

//     while(i < size) {
//         arr[i]++;
//         i++;
//     }
//     return arr[4];
// }

/*-----------------------------------------------*/
/* Test: Pointers */

// int main()
// {
//     int x = 5;
//     int *ptr = &x;
//     int **ptr2 = &ptr;
//     *ptr = 10;
//     print_memory();
//     return **ptr2 * **ptr2;
// }

/*-----------------------------------------------*/
/* Test: Pointers & Array */

// int main()
// {
//     int arr[3] = {1, 2, 3};
//     int *ptr = &arr[1];
//     *ptr = 3;
//     print_memory();
//     return arr[1];
// }

/*-----------------------------------------------*/
/* Test: Malloc & Free */

// int main()
// {
//     int x = 5;
//     int *ptr = malloc(8);
//     print_memory();
//     *ptr = 7;
//     int y = x + *ptr;
//     print_memory();
//     free(ptr);
//     print_memory();
//     return y;
// }

/*-----------------------------------------------*/
/* Test: Use after free */

// int main()
// {
//     int x = 5;
//     int *ptr = malloc(8);
//     *ptr = 7;
//     int y = x + *ptr;
//     free(ptr);
//     print_memory();
//     return *ptr;
// }

/*-----------------------------------------------*/
/* NEW */

//while loop
// unit test: while loop -> 5
// int main() {
// 	int x = 0;
// 	while(x < 5) {
// 		x++;
// 	}
// 	return x;
// }

// unit test: while loop with break -> 1
// int main() {
// 	int x = 0;
// 	while(x < 5) {
// 		x++;
// 		break;
// 	}
// 	return x;
// }

// unit test: while loop with continue -> 4
// int main() {
// 	int x = 0;
// 	int i = 0;
// 	while(i < 5) {
// 		i++;
// 		if(i == 2) continue;
// 		x++;
// 	}
// 	return x;
// }

// integration test: while loop with function call -> 50
// int f(int a, int b) {
// 	return a * b;
// }

// int main() {
// 	int x = 0;
// 	int i = 0;
// 	while(i < 5) {
// 		x += f(2, 5);
//         i++;
// 	}
// 	return x;
// }

// integration test: while loop with array -> 50
// int main() {
// 	int arr[5] = {1, 2, 3, 4, 5};
// 	int i = 0;
// 	while(i < 5) {
// 		arr[i] *= 10;
//         i++;
// 	}
// 	return arr[4];
// }

// integration test: while loop with malloc and free -> 50
// int main() {
// 	int x = 0;
// 	int i = 0;
// 	while(i < 5) {
// 		int *ptr = malloc(8);
// 		*ptr = 10;
// 		x = x + *ptr; // TODO: change to x += *ptr
// 		free(ptr);
// 		i++;
// 	}
// 	return x;
// }

// unit test: if block -> 5
// int main() {
//     int x = 0;
// 	if(1) x += 1;
// 	if(1) x += 1;
// 	if(1) x += 1;
// 	if(1) x += 1;
// 	if(1) x += 1;
// 	if(0) x += 1; // do not add
//     return x;
// }

// unit test: else if block -> 2
// int main() {
//     int x = 0;
// 	if(0) {
//         x += 1;
//     } else if (1) {
//         x += 2;
//     } else {
//         x += 3;
//     }
//     return x;
// }

// unit test: else block -> 3
// int main() {
//     int x = 0;
// 	if(0) {
//         x += 1;
//     } else if (0) {
//         x += 2;
//     } else {
//         x += 3;
//     }
//     return x;
// }


