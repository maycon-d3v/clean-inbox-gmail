namespace GmailCleanup.API.DTOs;

public class CleanupResponse
{
    public bool Success { get; set; }
    public int TotalDeleted { get; set; }
    public string Message { get; set; } = string.Empty;
    public CleanupDetails Details { get; set; } = new();
}

public class CleanupDetails
{
    public int UnreadDeleted { get; set; }
    public int SpamDeleted { get; set; }
    public int TrashDeleted { get; set; }
    public int OldEmailsDeleted { get; set; }
}
