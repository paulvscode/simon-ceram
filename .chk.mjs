import { chromium, devices } from "playwright";
import fs from "fs";
const pw = fs.readFileSync(".env.local","utf8").match(/^ADMIN_PASSWORD=(.*)$/m)[1].replace(/^["']|["']$/g,"");
const b = await chromium.launch();
for (const [label, B] of [["local", "http://localhost:3000"], ["live", "https://simon-ceramique.vercel.app"]]) {
  for (const [name, opts] of [["desktop", { viewport: { width: 1440, height: 900 } }], ["phone", { ...devices["iPhone 13"] }]]) {
    const p = await (await b.newContext(opts)).newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 300)));
    p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 300)); });
    await p.request.post(B + "/api/auth/login", { data: { password: pw } });
    for (const hash of ["", "#site"]) {
      await p.goto(B + "/admin" + hash, { waitUntil: "networkidle", timeout: 120000 });
      await p.waitForTimeout(1500);
      const shown = await p.getByText("Les données n’ont pas pu être chargées").isVisible().catch(() => false);
      console.log(label, name, "/admin" + hash, "→", shown ? "ERROR PAGE" : "ok");
    }
    if (errs.length) console.log("   errors:\n   " + [...new Set(errs)].join("\n   "));
    await p.context().close();
  }
}
await b.close();
