/* start a */
function hola1() {
  if (Math.random() > 0.5) {
    hola2()
  } else {
    console.log('hola1')
  }
}
function hola2() {
  console.log('hola2')
}
export { hola1, hola2 }
/* end a */
