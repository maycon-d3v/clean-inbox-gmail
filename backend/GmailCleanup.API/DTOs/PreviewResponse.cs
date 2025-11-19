namespace GmailCleanup.API.DTOs;

public class PreviewResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public List<EmailGroup> Groups { get; set; } = new();
    public int TotalEmails { get; set; }
    public string Category { get; set; } = string.Empty; // "unread", "spam", "trash", "old"
}
