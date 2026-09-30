/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error no types
import { decode } from "cbor-web";
import type { ClassifierResult, ManeuverEvent, Sample } from "../types";
import { classify, type ActivitySegment, type SlotId } from "@thesis/ai-classifier";

export async function loadCbor(file: File): Promise<{
  results: ClassifierResult[];
  predictions: ClassifierResult[];
  data: Sample[];
  intervalMs: number;
  manuevers: ManeuverEvent[];
  activities: ActivitySegment[];
  classifierSlot: SlotId;
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

    sensors.forEach((rawName: string, i: number) => {
      const name = String(rawName).toLowerCase();
      if (name === "accx") sample.ax = row[i];
      if (name === "accy") sample.ay = row[i];
      if (name === "accz") sample.az = row[i];
      if (name === "gyrx") sample.gx = row[i];
      if (name === "gyry") sample.gy = row[i];
      if (name === "gyrz") sample.gz = row[i];
      if (name === "magx") sample.mx = row[i];
      if (name === "magy") sample.my = row[i];
      if (name === "magz") sample.mz = row[i];
      if (name === "lat" || name === "latitude") sample.lat = row[i];
      if (name === "lon" || name === "lng" || name === "longitude") sample.lon = row[i];
      if (name === "fix") sample.fix = row[i];
      if (name === "alt" || name === "altitude") sample.alt = row[i];
      if (name === "sat" || name === "satellites") sample.sat = row[i];
      if (name === "roll") sample.roll = row[i];
      if (name === "pitch") sample.pitch = row[i];
      if (name === "yaw") sample.yaw = row[i];
      if (name === "pressure" || name === "pressure_pa") sample.pressure = row[i];
      if (name === "temperature" || name === "temperature_c") sample.temperature = row[i];
    });

    return sample as Sample;
  });
  const classified = classify(data);
  return {
    results,
    data,
    intervalMs,
    manuevers: classified.events,
    predictions: classified.predictions,
    activities: classified.segments,
    classifierSlot: classified.slot,
  };
}
