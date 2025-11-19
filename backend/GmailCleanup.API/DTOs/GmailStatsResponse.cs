namespace GmailCleanup.API.DTOs;

public class GmailStatsResponse
{
    public int UnreadCount { get; set; }
    public int SpamCount { get; set; }
    public int TrashCount { get; set; }
    public int OldEmailsCount { get; set; }
}
