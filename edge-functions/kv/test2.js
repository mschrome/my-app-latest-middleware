export async function onRequest(context) {
  return globalThis.kv_test.get('heiheihei')
  
}