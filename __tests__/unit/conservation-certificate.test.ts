import { it, expect } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { verifyConservation } from "../../scripts/financial-spaces/verify-conservation.mjs";

it("invalidates an old successful certificate even if opening the first database fails", async () => {
  const outputDirectory=path.resolve(".local/financial-spaces/verifier-test-"+randomUUID());
  await fs.mkdir(outputDirectory,{recursive:true});
  try {
    await fs.writeFile(path.join(outputDirectory,"conservation-report.json"),JSON.stringify({preserved:true}));
    const result=await verifyConservation({outputDirectory,connect:async()=>{throw new Error("fixture connection refused");}});
    expect(result.preserved).toBe(false);
    expect(JSON.parse(await fs.readFile(path.join(outputDirectory,"conservation-report.json"),"utf8")).preserved).toBe(false);
  } finally { await fs.rm(outputDirectory,{recursive:true}); }
});

it("closes the already-open baseline and invalidates the certificate if the work connection fails", async () => {
  const outputDirectory=path.resolve(".local/financial-spaces/verifier-test-"+randomUUID());
  await fs.mkdir(outputDirectory,{recursive:true});
  let closed=false;
  try {
    await fs.writeFile(path.join(outputDirectory,"conservation-report.json"),JSON.stringify({preserved:true}));
    const baseline=new Client(); // Never connected: this case fails before any query.
    baseline.end=async()=>{closed=true;};
    const result=await verifyConservation({outputDirectory,connect:async(name="")=>{
      if(name==="spaces_baseline17") return baseline;
      throw new Error("fixture work connection refused");
    }});
    expect(result.preserved).toBe(false);
    expect(closed).toBe(true);
    expect(JSON.parse(await fs.readFile(path.join(outputDirectory,"conservation-report.json"),"utf8")).preserved).toBe(false);
  } finally { await fs.rm(outputDirectory,{recursive:true}); }
});
