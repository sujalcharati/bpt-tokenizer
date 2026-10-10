
function train(text, vocabSize) {

  const data = new TextEncoder();
  const encoder = data.encode(text);
  const id = Array.from(encoder);

  const merges = new Map();
  let current = id;
  let newid = 256;
  const numMerges = vocabSize - 256;

  for (let i = 0; i < numMerges; i++) {

    const map = getPairCounts(current);
    const sorted = Array.from(map).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0 || sorted[0][1] < 2) break;

    const pair = sorted[0][0].split(",").map(Number);
    current = merge(current, pair, newid);
    merges.set(sorted[0][0], newid);

    console.log(`round ${i + 1}: merged [${pair}] -> ${newid}, length ${current.length}`);
    newid += 1;
  }

  return merges;
}

function getPairCounts(id) {

  const adjacentmaps = new Map();

  for (let i = 0; i < id.length - 1; i++) {

    const key = `${id[i]},${id[i + 1]}`;

    adjacentmaps.set(key, (adjacentmaps.get(key) ?? 0) + 1);

  }

  return adjacentmaps;
}


function merge(id, pair, newid) {

  const out = [];

  let i = 0;

  while (i < id.length) {
    if (i < id.length - 1 && id[i] === pair[0] && id[i + 1] === pair[1]) {
      out.push(newid);
      i += 2;
    } else {
      out.push(id[i]);
      i += 1;
    }
  }

  return out;
}

function encode(text, merges) {

  const data = new TextEncoder();
  const idsobject = data.encode(text);
  let ids = Array.from(idsobject);

  while (ids.length >= 2) { 

    const pairs = getPairCounts(ids);

    let bestkey = "";
    let bestid = Infinity;

    for (const key of pairs.keys()) {

      if (merges.has(key) && merges.get(key) < bestid) {
        bestkey = key;
        bestid = merges.get(key);
      }

    }

    if (bestkey === "") break;

    const pair = bestkey.split(",").map(Number);
    ids = merge(ids, pair, bestid);

  }

  return ids;
}

function decode(ids, merges) {

  const vocab = new Map();

  for (let i = 0; i < 256; i++) {
    vocab.set(i, [i]);
  }

  for (const [key, newid] of merges) {
    const [a, b] = key.split(",").map(Number);
    vocab.set(newid, [...vocab.get(a), ...vocab.get(b)]);
  }

  const bytes = [];
  for (const id of ids) {
    bytes.push(...vocab.get(id));
  }

  const data = new TextDecoder();
  return data.decode(new Uint8Array(bytes));
}


const sentence = "the cat sat on the mat the cat is fat";
const merges = train(sentence, 266);

console.log(encode(sentence, merges));
console.log(decode(encode("the cat sat", merges), merges));