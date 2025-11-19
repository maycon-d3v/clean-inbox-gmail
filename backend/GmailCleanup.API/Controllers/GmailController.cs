using GmailCleanup.API.DTOs;
using GmailCleanup.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace GmailCleanup.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GmailController : ControllerBase
{
    private readonly GmailCleanupService _gmailService;
    private readonly SessionManager _sessionManager;
    private readonly ILogger<GmailController> _logger;

    public GmailController(
        GmailCleanupService gmailService,
        SessionManager sessionManager,
        ILogger<GmailController> logger)
    {
        _gmailService = gmailService;
        _sessionManager = sessionManager;
        _logger = logger;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string sessionId)
    {
        var session = _sessionManager.GetSession(sessionId);

        if (session == null)
        {
            return Unauthorized(new { error = "Invalid or expired session" });
        }

        var stats = await _gmailService.GetStatsAsync(session);
        return Ok(stats);
    }

    [HttpPost("preview")]
    public async Task<IActionResult> GetPreview([FromQuery] string sessionId, [FromBody] CleanupRequest request)
    {
        var session = _sessionManager.GetSession(sessionId);

        if (session == null)
        {
            return Unauthorized(new { error = "Invalid or expired session" });
        }

        _logger.LogInformation("Getting preview for user {Email}", session.Email);

        var result = await _gmailService.GetPreviewAsync(session, request);
        return Ok(result);
    }

    [HttpPost("cleanup")]
    public async Task<IActionResult> Cleanup([FromQuery] string sessionId, [FromBody] CleanupRequest request)
    {
        var session = _sessionManager.GetSession(sessionId);

        if (session == null)
        {
            return Unauthorized(new { error = "Invalid or expired session" });
        }

        _logger.LogInformation("Starting cleanup for user {Email}", session.Email);

        var result = await _gmailService.CleanupAsync(session, request);
        return Ok(result);
    }
}
