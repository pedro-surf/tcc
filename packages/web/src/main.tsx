import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import './components/forms/forms.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext'
import { SimulationPage } from './features/simulation/SimulationPage'
import { SpotDetailsPage } from './features/spots/SpotDetailsPage'
import { FriendsPage } from './features/friends/FriendsPage'
import { MarketplacePage } from './features/marketplace/MarketplacePage'
import { HighscoresPage } from './features/stats/HighscoresPage'
import { EventsPage } from './features/events/EventsPage'
import { EventPage } from './features/events/EventPage'
import { HeatJudgingPage } from './features/events/HeatJudgingPage'
import { SpotRankingPage } from './features/ranking/SpotRankingPage'
import { LiveBuoyPage } from './features/live/LiveBuoyPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function AppShell({ children }: { children: React.ReactNode }) {
  return <App>{children}</App>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/simulation" element={<SimulationPage />} />
            <Route
              path="/live"
              element={
                <AppShell>
                  <LiveBuoyPage />
                </AppShell>
              }
            />
            <Route
              path="/spots/:spotId"
              element={
                <AppShell>
                  <SpotDetailsPage />
                </AppShell>
              }
            />
            <Route
              path="/friends"
              element={
                <AppShell>
                  <FriendsPage />
                </AppShell>
              }
            />
            <Route
              path="/marketplace"
              element={
                <AppShell>
                  <MarketplacePage />
                </AppShell>
              }
            />
            <Route
              path="/highscores"
              element={
                <AppShell>
                  <HighscoresPage />
                </AppShell>
              }
            />
            <Route
              path="/ranking"
              element={
                <AppShell>
                  <SpotRankingPage />
                </AppShell>
              }
            />
            <Route
              path="/events/:eventId/heats/:heatId"
              element={
                <AppShell>
                  <HeatJudgingPage />
                </AppShell>
              }
            />
            <Route
              path="/events/:eventId"
              element={
                <AppShell>
                  <EventPage />
                </AppShell>
              }
            />
            <Route
              path="/events"
              element={
                <AppShell>
                  <EventsPage />
                </AppShell>
              }
            />
            <Route path="*" element={<App />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
