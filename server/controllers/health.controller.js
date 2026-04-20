export function getHealth(req, res) {
  res.json({
    ok: true,
    service: 'skill-exchange-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
}
