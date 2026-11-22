#!/usr/bin/env node
/* 真值 · 哈希链台账：append-only JSONL，每条记录含前条哈希，篡改即断链。
 * 「得一」必须可追溯：谁在何时写入了什么，链上自证。 */
const fs = require("fs"), crypto = require("crypto");
const GENESIS = "0".repeat(64);
function hashRec(rec) {
  return crypto.createHash("sha256").update(JSON.stringify({ seq: rec.seq, prev: rec.prev, at: rec.at, type: rec.type, payload: rec.payload })).digest("hex");
}
class Ledger {
  constructor(file) { this.file = file; }
  append(type, payload) {
    const prev = this.lastHash();
    const rec = { seq: this.length() + 1, prev, at: new Date().toISOString(), type, payload };
    rec.hash = hashRec(rec);
    fs.appendFileSync(this.file, JSON.stringify(rec) + "\n");
    return rec;
  }
  records() {
    if (!fs.existsSync(this.file)) return [];
    return fs.readFileSync(this.file, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
  }
  length() { return this.records().length; }
  lastHash() { const rs = this.records(); return rs.length ? rs[rs.length - 1].hash : GENESIS; }
  verify() {
    const rs = this.records(); let prev = GENESIS, broken = [];
    rs.forEach((rec, i) => {
      const expect = { seq: i + 1, prev, at: rec.at, type: rec.type, payload: rec.payload };
      if (rec.seq !== i + 1 || rec.prev !== prev || hashRec(expect) !== rec.hash) broken.push(i + 1);
      prev = rec.hash;
    });
    return { ok: broken.length === 0, total: rs.length, broken };
  }
}
module.exports = { Ledger, hashRec };
if (require.main === module) {
  const cmd = process.argv[2], file = process.argv[3];
  if (cmd === "verify") { const r = new Ledger(file).verify(); console.log(r.ok ? `链完整：${r.total} 条，无断链` : `断链！损坏条目: ${r.broken.join(",")}`); process.exit(r.ok ? 0 : 1); }
  else if (cmd === "append") { const rec = new Ledger(file).append(process.argv[4] || "note", JSON.parse(process.argv[5] || "{}")); console.log(`#${rec.seq} ${rec.hash.slice(0, 16)}…`); }
  else console.error("用法: node ledger.js append <台账文件> <类型> '<payload JSON>' | verify <台账文件>");
}
