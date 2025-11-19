namespace GmailCleanup.API.DTOs;

public class EmailGroup
{
    public string GroupName { get; set; } = string.Empty;
    public string GroupType { get; set; } = string.Empty; // "sender", "category", "size", "other"
    public string Category { get; set; } = string.Empty; // "unread", "spam", "trash", "old"
    public int Count { get; set; }
    public List<string> MessageIds { get; set; } = new();
    public string? Description { get; set; }
    public bool Selected { get; set; } = true;
}
