import { createHash } from 'node:crypto'

function xorshift32(seed) {
  let x = seed >>> 0
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return x >>> 0
  }
}

function l2Normalize(vector) {
  let sumSq = 0
  for (const v of vector) sumSq += v * v
  const norm = Math.sqrt(sumSq) || 1
  return vector.map((v) => v / norm)
}

function seedFromText(text) {
  const hash = createHash('sha256').update(text).digest()
  // 取前 4 字节作为 seed
  return hash.readUInt32LE(0)
}

export function embedMock(texts, dim) {
  return texts.map((text) => {
    const rand = xorshift32(seedFromText(text))
    const vector = new Array(dim)
    for (let i = 0; i < dim; i++) {
      // [0, 1) -> [-1, 1)
      const v = (rand() / 0xffffffff) * 2 - 1
      vector[i] = v
    }
    return l2Normalize(vector)
  })
}
