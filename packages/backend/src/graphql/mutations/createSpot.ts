import { createCreateMutation } from "../utils/createMutation";

createCreateMutation(
  'spot',
  'Spot',
  (t) => ({
    name: t.string({ required: true }),
    difficulty: t.string(),
    type: t.string(),
  })
);