![alt text](<Arquitetura de sistema para surfe.png>)

Weekly marine ingest and AI outlooks run in `@thesis/ai-forecast` (Lambda + serverless-offline). The backend GraphQL/REST layer only invokes that function; Open-Meteo, OpenAI, and forecast Prisma writes happen there.
