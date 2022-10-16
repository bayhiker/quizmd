//Use Fisher-Yates shuffle to randomly shuffle an array
//Credit: https://javascript.info/array-methods#shuffle-an-array
export function shuffle(a: any[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    [a[i], a[j]] = [a[j], a[i]];
  }
}
