import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useAuth } from '../context/useAuth.js'
import { useToast } from '../context/useToast.js'
import { api } from '../lib/api.js'
import { getApiErrorMessage } from '../lib/apiError.js'

function peerId(req, myId) {
  return String(req.senderId) === String(myId) ? String(req.receiverId) : String(req.senderId)
}

export default function SkillExchangePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [matches, setMatches] = useState([])
  const [requests, setRequests] = useState([])
  const [busyKey, setBusyKey] = useState('')
  const [myId, setMyId] = useState('')
  const [searchText, setSearchText] = useState('')
  const [filterMode, setFilterMode] = useState('all')

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [{ data: matchRes }, { data: requestRes }, { data: meRes }] = await Promise.all([
        api.get('/matches'),
        api.get('/requests', { params: { type: 'all' } }),
        api.get('/users/me'),
      ])
      const meId = meRes?.user?.id ?? meRes?.user?._id ?? ''
      const matchRows = (matchRes?.data ?? []).filter(
        (m) => Number(m.matchScore) > 0 && String(m.id) !== String(meId),
      )
      setMatches(matchRows)
      setRequests(requestRes?.data ?? [])
      setMyId(meId)
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load skill exchange data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAll()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadAll])

  const requestByPeerMap = useMemo(() => {
    const sorted = [...requests].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    const map = new Map()
    for (const req of sorted) {
      if (req.status !== 'pending' && req.status !== 'accepted' && req.status !== 'completed') continue
      const pid = peerId(req, myId)
      if (!map.has(pid)) map.set(pid, req)
    }
    return map
  }, [myId, requests])

  const requestStats = useMemo(() => {
    const pendingIncoming = requests.filter(
      (r) => r.status === 'pending' && String(r.receiverId) === String(myId),
    ).length
    const pendingOutgoing = requests.filter(
      (r) => r.status === 'pending' && String(r.senderId) === String(myId),
    ).length
    const accepted = requests.filter((r) => r.status === 'accepted').length
    return { pendingIncoming, pendingOutgoing, accepted }
  }, [myId, requests])

  const filteredMatches = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return matches.filter((m) => {
      const linkedReq = requestByPeerMap.get(String(m.id))
      const connected = Boolean(linkedReq)
      const filterPass =
        filterMode === 'all' ? true : filterMode === 'available' ? !connected : connected
      if (!filterPass) return false
      if (!q) return true
      const haystack = (Array.isArray(m.skillsOffered) ? m.skillsOffered : []).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [filterMode, matches, requestByPeerMap, searchText])

  const sendRequest = async (receiverId) => {
    setBusyKey(`request:${receiverId}`)
    try {
      await api.post('/requests', { receiverId, meetingLink: '' })
      toast.success('Exchange request sent')
      await loadAll()
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not send request.'))
    } finally {
      setBusyKey('')
    }
  }

  // Safety fallback: route already protects this page.
  if (user?.role !== 'both' || !user?.isApproved) {
    return (
      <Card variant="elevated">
        <Card.Body className="p-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Skill Exchange unavailable</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Skill Exchange is available only for approved <strong>both</strong> users.
          </p>
        </Card.Body>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-fuchsia-50 p-5 dark:border-indigo-500/20 dark:from-indigo-900/30 dark:to-fuchsia-900/20">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Skill Exchange</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Connect with matched partners and send exchange requests.
        </p>
      </header>

      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}
      {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading skill exchange data...</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card variant="elevated">
          <Card.Body className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Matches</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{matches.length}</p>
          </Card.Body>
        </Card>
        <Card variant="elevated">
          <Card.Body className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Incoming pending</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{requestStats.pendingIncoming}</p>
          </Card.Body>
        </Card>
        <Card variant="elevated">
          <Card.Body className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Outgoing pending</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{requestStats.pendingOutgoing}</p>
          </Card.Body>
        </Card>
        <Card variant="elevated">
          <Card.Body className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Accepted</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{requestStats.accepted}</p>
          </Card.Body>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Matched Users</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by offered skill"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="all">All matches</option>
              <option value="available">Available to request</option>
              <option value="connected">Already connected</option>
            </select>
          </div>
        </div>
        {!loading && filteredMatches.length === 0 ? (
          <EmptyState title="No matches yet" description="Add more skills to find exchange partners." />
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMatches.map((m) => {
            const linkedReq = requestByPeerMap.get(String(m.id))
            const alreadyConnected = Boolean(linkedReq)
            return (
              <Card key={m.id} variant="elevated">
                <Card.Body className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{m.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Offers: {(m.skillsOffered ?? []).join(', ') || '—'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Wants: {(m.skillsWanted ?? []).join(', ') || '—'}
                  </p>
                  {linkedReq ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Current request status: <span className="font-semibold">{linkedReq.status}</span>
                    </p>
                  ) : null}
                </Card.Body>
                <Card.Footer className="pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="accent"
                      disabled={alreadyConnected}
                      loading={busyKey === `request:${m.id}`}
                      onClick={() => sendRequest(m.id)}
                    >
                      {alreadyConnected ? 'Already Connected' : 'Send Request'}
                    </Button>
                    <Link to={`/users/${m.id}`} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                      View Profile
                    </Link>
                  </div>
                </Card.Footer>
              </Card>
            )
          })}
        </div>
      </section>

      <section>
        <Card variant="elevated">
          <Card.Body className="p-5">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Request acceptance, meeting link, and schedule management are handled in the Session and Requests pages.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button to="/requests" size="sm" variant="secondary">
                Open Requests
              </Button>
              <Button to="/session" size="sm" variant="outline">
                Open Session
              </Button>
            </div>
          </Card.Body>
        </Card>
      </section>
    </div>
  )
}

