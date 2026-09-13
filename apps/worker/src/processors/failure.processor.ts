export async function processFailureJob() {
  throw new Error("Intentional failure for retry testing");
}