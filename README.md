# zhenzhi-ledger 真值 · 哈希链台账

> 「得一」必须可追溯：谁在何时写入了什么，链上自证。

append-only JSONL 台账，每条记录含前条哈希（SHA-256），任何篡改即断链。三行接入：

```js
const { Ledger } = require("zhenzhi-ledger");
const led = new Ledger("truth.jsonl");
led.append("verdict", { item: "A1", verdict: "pass" });
led.verify(); // { ok: true, total: 1, broken: [] }
```

CLI：`node ledger.js append truth.jsonl verdict '{"k":1}'` / `node ledger.js verify truth.jsonl`

License: Apache-2.0
