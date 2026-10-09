import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import SessionDetail from '../../SessionDetails'
import { useAuth } from '../../auth/AuthContext'
import type { Sample, Session } from '../../types'
import { loadSessionFiles, sessionFromSamples } from '../../utils/loadSessionFile'
import { fakeSessions } from '../../utils/fakeSessions'
import { ImportCutModal } from './ImportCutModal'
import {
  fetchSavedSession,
  importSession,
  inferIntervalMs,
  samplesFromSaved,
  useSavedSessions,
} from './api'

type ImportDraft = {
  label: string
  samples: Sample[]
  intervalMs: number
}

export function SessionsPage() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const savedSessions = useSavedSessions(isAuthenticated)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [secondSelectedSession, setSecondSelectedSession] =
    useState<Session | null>(null)
  const [mode, setMode] = useState<'compare' | 'single'>('single')
  const [importError, setImportError] = useState<string | null>(null)
  const [importDraft, setImportDraft] = useState<ImportDraft | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length === 0) return
    try {
      const { data: samples, intervalMs, label, skipped } = await loadSessionFiles(files)
      if (!samples?.length) return
      setImportError(
        skipped.length
          ? `Skipped ${skipped.map((item) => `${item.name}: ${item.reason}`).join('; ')}`
          : null,
      )
      setImportDraft({ label, samples, intervalMs })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const acceptImport = async (session: Session, startedAtMs: number) => {
    const date =
      startedAtMs > 1_000_000_000_000
        ? new Date(startedAtMs).toISOString()
        : new Date().toISOString()
    await importSession({
      notes: session.id,
      date,
      samples: session.samples,
      maneuvers: session.manuevers,
    })
    await queryClient.invalidateQueries({ queryKey: ['SavedSessions'] })
    setImportDraft(null)
    if (selectedSession) setSecondSelectedSession(session)
    else setSelectedSession(session)
  }

  const handleSelectSession = (s: Session) => {
    if (selectedSession) {
      setSecondSelectedSession(s)
      return
    }
    setSelectedSession(s)
  }

  const openSaved = async (id: string) => {
    setOpeningId(id)
    setImportError(null)
    try {
      const row = await fetchSavedSession(id)
      if (!row || row.samples.length === 0) {
        setImportError('Saved session has no samples')
        return
      }
      const samples = samplesFromSaved(row.samples)
      handleSelectSession(
        sessionFromSamples(row.notes || row.id, samples, inferIntervalMs(samples)),
      )
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not open session')
    } finally {
      setOpeningId(null)
    }
  }

  const hideInputs =
    (mode === 'single' && selectedSession) ||
    (mode === 'compare' && selectedSession && secondSelectedSession)

  return (
    <div className="sessions-page">
      {selectedSession && mode === 'single' ? (
        <p className="app-meta">
          Session {selectedSession.id} — {selectedSession.samples.length} samples
        </p>
      ) : null}
      {importError ? <p className="app-meta">{importError}</p> : null}

      {!hideInputs && (
        <>
          <div className="d-flex flex-clmn">
            <h2>Import session file</h2>
            <p className="app-meta">One CBOR, or several CSVs joined in order</p>
            <div>
              <input
                type="file"
                accept=".cbor,.csv,text/csv"
                multiple
                onChange={handleImportFile}
              />
            </div>
          </div>
          <div className="d-flex flex-clmn">
            <h2>Saved sessions</h2>
            {!isAuthenticated ? (
              <p className="app-meta">Sign in to save a session and see it here.</p>
            ) : savedSessions.isLoading ? (
              <p className="app-meta">Loading saved sessions…</p>
            ) : savedSessions.isError ? (
              <p className="app-meta">
                {savedSessions.error instanceof Error
                  ? savedSessions.error.message
                  : 'Could not load saved sessions'}
              </p>
            ) : savedSessions.data?.length ? (
              savedSessions.data.map((session) => (
                <button
                  className="mb-2"
                  key={session.id}
                  disabled={openingId === session.id}
                  onClick={() => openSaved(session.id)}
                >
                  {session.notes || 'Session'} — {new Date(session.date).toLocaleString()}
                  {session.durationMin > 0 ? ` · ${session.durationMin} min` : ''}
                </button>
              ))
            ) : (
              <p className="app-meta">No saved sessions yet.</p>
            )}
          </div>
          <div className="d-flex flex-clmn">
            <h2>Mock sessions</h2>
            {fakeSessions.map((s) => (
              <button
                className="mb-2"
                key={s.id}
                onClick={() => handleSelectSession(s)}
              >
                {s.id} ({s.samples.length} amostras)
              </button>
            ))}
            <div className="d-flex flex-clmn">
              <select
                value={mode}
                onChange={(sel) =>
                  setMode(sel.target.value as 'single' | 'compare')
                }
              >
                <option value="compare">Compare sample pair</option>
                <option value="single">Analyse single sample</option>
              </select>
              {mode === 'compare' && !secondSelectedSession && selectedSession
                ? 'Sample 1 ok. Select Sample 2'
                : ''}
            </div>
          </div>
        </>
      )}

      {mode === 'single' && selectedSession && (
        <SessionDetail session={selectedSession} />
      )}
      {importDraft ? (
        <ImportCutModal
          label={importDraft.label}
          samples={importDraft.samples}
          onCancel={() => setImportDraft(null)}
          buildSession={(samples) =>
            sessionFromSamples(importDraft.label, samples, importDraft.intervalMs)
          }
          onConfirm={acceptImport}
        />
      ) : null}

      {mode === 'compare' && selectedSession && secondSelectedSession && (
        <div className="d-flex">
          <SessionDetail
            hideManuevers
            hideReplay
            hideTimeline
            session={selectedSession}
          />
          <SessionDetail
            hideManuevers
            hideReplay
            hideTimeline
            session={secondSelectedSession}
          />
        </div>
      )}
    </div>
  )
}
