using Google.Apis.Auth.OAuth2;
using Google.Apis.Gmail.v1;

namespace GmailCleanup.API.Models;

public class UserSession
{
    public string SessionId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Picture { get; set; } = string.Empty;
    public UserCredential Credential { get; set; } = null!;
    public GmailService GmailService { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}
