using GmailCleanup.API.Models;
using System.Collections.Concurrent;

namespace GmailCleanup.API.Services;

public class SessionManager
{
    private readonly ConcurrentDictionary<string, UserSession> _sessions = new();
    private readonly TimeSpan _sessionTimeout = TimeSpan.FromHours(2);

    public void AddSession(UserSession session)
    {
        session.SessionId = Guid.NewGuid().ToString();
        session.CreatedAt = DateTime.UtcNow;
        session.ExpiresAt = DateTime.UtcNow.Add(_sessionTimeout);
        _sessions[session.SessionId] = session;
    }

    public UserSession? GetSession(string sessionId)
    {
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            if (session.ExpiresAt > DateTime.UtcNow)
            {
                // Extend session
                session.ExpiresAt = DateTime.UtcNow.Add(_sessionTimeout);
                return session;
            }

            // Session expired, remove it
            _sessions.TryRemove(sessionId, out _);
        }

        return null;
    }

    public void RemoveSession(string sessionId)
    {
        _sessions.TryRemove(sessionId, out _);
    }

    public void CleanExpiredSessions()
    {
        var expiredSessions = _sessions
            .Where(s => s.Value.ExpiresAt <= DateTime.UtcNow)
            .Select(s => s.Key)
            .ToList();

        foreach (var sessionId in expiredSessions)
        {
            _sessions.TryRemove(sessionId, out _);
        }
    }
}
