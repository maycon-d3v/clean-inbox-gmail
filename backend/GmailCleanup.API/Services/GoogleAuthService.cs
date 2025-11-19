using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Gmail.v1;
using Google.Apis.Services;
using GmailCleanup.API.Models;
using System.Text.Json;

namespace GmailCleanup.API.Services;

public class GoogleAuthService
{
    private readonly GoogleOAuthSettings _settings;
    private readonly SessionManager _sessionManager;
    private readonly ILogger<GoogleAuthService> _logger;

    private static readonly string[] Scopes = {
        GmailService.Scope.MailGoogleCom,
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    };

    public GoogleAuthService(
        GoogleOAuthSettings settings,
        SessionManager sessionManager,
        ILogger<GoogleAuthService> logger)
    {
        _settings = settings;
        _sessionManager = sessionManager;
        _logger = logger;
    }

    public string GetAuthorizationUrl(string state, bool forceAccountSelection = false)
    {
        var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = new ClientSecrets
            {
                ClientId = _settings.ClientId,
                ClientSecret = _settings.ClientSecret
            },
            Scopes = Scopes
        });

        var codeRequestUrl = flow.CreateAuthorizationCodeRequest(_settings.RedirectUri);
        codeRequestUrl.State = state;

        var authUrl = codeRequestUrl.Build().ToString();

        if (forceAccountSelection)
        {
            authUrl += "&prompt=select_account";
        }

        return authUrl;
    }

    public async Task<UserSession?> HandleCallbackAsync(string code)
    {
        try
        {
            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = _settings.ClientId,
                    ClientSecret = _settings.ClientSecret
                },
                Scopes = Scopes
            });

            var tokenResponse = await flow.ExchangeCodeForTokenAsync(
                "user",
                code,
                _settings.RedirectUri,
                CancellationToken.None);

            var credential = new UserCredential(flow, "user", tokenResponse);

            // Get user info
            var userInfo = await GetUserInfoAsync(tokenResponse.AccessToken);

            // Create Gmail service
            var gmailService = new GmailService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "Gmail Cleanup App"
            });

            var session = new UserSession
            {
                Email = userInfo.Email,
                Name = userInfo.Name,
                Picture = userInfo.Picture,
                Credential = credential,
                GmailService = gmailService
            };

            _sessionManager.AddSession(session);

            return session;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling OAuth callback");
            return null;
        }
    }

    private async Task<(string Email, string Name, string Picture)> GetUserInfoAsync(string accessToken)
    {
        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");

        var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var userInfo = JsonSerializer.Deserialize<JsonElement>(json);

        return (
            userInfo.GetProperty("email").GetString() ?? "",
            userInfo.GetProperty("name").GetString() ?? "",
            userInfo.GetProperty("picture").GetString() ?? ""
        );
    }
}
