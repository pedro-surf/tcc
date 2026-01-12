/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error no types
import { decode } from "cbor-web";
import type { ClassifierResult, ManeuverEvent, Sample } from "../types";
import { detectManeuvers } from "./detectManeuvers";

export async function loadCbor(file: File): Promise<{
  results: ClassifierResult[];
  prediction: ClassifierResult;
  data: Sample[];
  intervalMs: number;
  manuevers: ManeuverEvent[];
}> {
  const buffer = await file.arrayBuffer();
  const decoded: any = decode(new Uint8Array(buffer));

  const payload = decoded.payload;
  const sensors = payload.sensors.map((s: any) => s.name);
  const intervalMs = payload.interval_ms;

  // @ts-expect-error dasd
  const classifier = new EdgeImpulseClassifier();
  await classifier.init();
  const { results }: { results: ClassifierResult[] } =
    await classifier.classify(payload.values.flat(), true);
  const data = payload.values.map((row: number[], index: number) => {
    const sample: any = {
      timestamp: index * intervalMs,
    };

    sensors.forEach((name: string, i: number) => {
      if (name === "accX") sample.ax = row[i];
      if (name === "accY") sample.ay = row[i];
      if (name === "accZ") sample.az = row[i];
      if (name === "gyrX") sample.gx = row[i];
      if (name === "gyrY") sample.gy = row[i];
      if (name === "gyrZ") sample.gz = row[i];
      if (name === "magX") sample.mx = row[i];
      if (name === "magY") sample.my = row[i];
      if (name === "magZ") sample.mz = row[i];
    });

    return sample as Sample;
  });
  const prediction = results.sort((a, b) => b.value - a.value)[0];
  const manuevers = detectManeuvers(data);
  return { results, data, intervalMs, manuevers, prediction };
}
