import { createCreateMutation } from "../utils/createMutation";

createCreateMutation(
  'user',
  'User',
  (t) => ({
    email: t.string({ required: true }),
    name: t.string(),
    password: t.string({ required: true }),
  })
);