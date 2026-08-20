![alt text](<Arquitetura de sistema para surfe.png>)

Weekly marine ingest and AI outlooks are triggered by `@thesis/ai-forecast` (Lambda/cron) against the backend job `POST /internal/jobs/weekly-forecast`. The backend remains the only proxy to Open-Meteo and OpenAI.
