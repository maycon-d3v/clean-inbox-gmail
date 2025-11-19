namespace GmailCleanup.API.DTOs;

public class CleanupRequest
{
    public bool CleanUnread { get; set; }
    public bool CleanSpam { get; set; }
    public bool CleanTrash { get; set; }
    public bool CleanOldEmails { get; set; }
    public int OldEmailsMonths { get; set; } = 12;
}
