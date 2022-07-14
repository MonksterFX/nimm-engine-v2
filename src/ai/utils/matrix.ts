// https://medium.com/swlh/matrix-rotation-in-javascript-269cae14a124
function rotateClockwise<T>(m: T[][]): T[][] {
  // get the dimensions of the source matrix
  const M = m.length;
  const N = m[0].length;

  // create a new NxM destination array
  let destination = new Array(N);
  for (let i = 0; i < N; i++) {
    destination[i] = new Array(M);
  }

  // start copying from source into destination
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      destination[i][j] = m[M - j - 1][i];
    }
  }

  // return the destination matrix
  return destination;
}

const MatrixFunctions = { rotateClockwise };

export default MatrixFunctions;
