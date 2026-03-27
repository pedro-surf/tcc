import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export function createCrud(model: keyof PrismaClient) {
  const entity = prisma[model] as any;

  return {
    getAll: async (req: Request, res: Response) => {
      const data = await entity.findMany();
      res.json(data);
    },

    getOne: async (req: Request, res: Response) => {
      const data = await entity.findUnique({
        where: { id: req.params.id },
      });
      res.json(data);
    },

    create: async (req: Request, res: Response) => {
      const data = await entity.create({
        data: req.body,
      });
      res.json(data);
    },

    update: async (req: Request, res: Response) => {
      const data = await entity.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json(data);
    },

    delete: async (req: Request, res: Response) => {
      await entity.delete({
        where: { id: req.params.id },
      });
      res.json({ success: true });
    },
  };
}