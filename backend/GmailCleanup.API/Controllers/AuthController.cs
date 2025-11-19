using GmailCleanup.API.DTOs;
using GmailCleanup.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace GmailCleanup.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly GoogleAuthService _authService;
    private readonly SessionManager _sessionManager;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        GoogleAuthService authService,
        SessionManager sessionManager,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _sessionManager = sessionManager;
        _logger = logger;
    }

    [HttpGet("login")]
    public IActionResult Login([FromQuery] bool forceAccountSelection = false)
    {
        var state = Guid.NewGuid().ToString();
        var authUrl = _authService.GetAuthorizationUrl(state, forceAccountSelection);

        return Ok(new { authUrl });
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string? error)
    {
        if (!string.IsNullOrEmpty(error))
        {
            _logger.LogWarning("OAuth callback error: {Error}", error);
            return Redirect($"{GetFrontendUrl()}/login?error={error}");
        }

        if (string.IsNullOrEmpty(code))
        {
            return BadRequest("No authorization code provided");
        }

        var session = await _authService.HandleCallbackAsync(code);

        if (session == null)
        {
            return Redirect($"{GetFrontendUrl()}/login?error=auth_failed");
        }

        // Redirect to frontend with session ID
        return Redirect($"{GetFrontendUrl()}/dashboard?sessionId={session.SessionId}");
    }

    [HttpGet("user")]
    public IActionResult GetUser([FromQuery] string sessionId)
    {
        var session = _sessionManager.GetSession(sessionId);

        if (session == null)
        {
            return Unauthorized();
        }

        return Ok(new UserInfoResponse
        {
            Email = session.Email,
            Name = session.Name,
            Picture = session.Picture
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout([FromQuery] string sessionId)
    {
        _sessionManager.RemoveSession(sessionId);
        return Ok(new { message = "Logged out successfully" });
    }

    private string GetFrontendUrl()
    {
        return "http://localhost:5173";
    }
}
