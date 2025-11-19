using Google.Apis.Gmail.v1;
using Google.Apis.Gmail.v1.Data;
using GmailCleanup.API.DTOs;
using GmailCleanup.API.Models;

namespace GmailCleanup.API.Services;

public class GmailCleanupService
{
    private readonly ILogger<GmailCleanupService> _logger;

    public GmailCleanupService(ILogger<GmailCleanupService> logger)
    {
        _logger = logger;
    }

    public async Task<GmailStatsResponse> GetStatsAsync(UserSession session)
    {
        var stats = new GmailStatsResponse();

        try
        {
            // Get unread count
            stats.UnreadCount = await GetMessageCountAsync(session.GmailService, "is:unread");

            // Get spam count
            stats.SpamCount = await GetMessageCountAsync(session.GmailService, "in:spam");

            // Get trash count
            stats.TrashCount = await GetMessageCountAsync(session.GmailService, "in:trash");

            // Get old emails count (older than 12 months)
            var oldDate = DateTime.UtcNow.AddMonths(-12).ToString("yyyy/MM/dd");
            stats.OldEmailsCount = await GetMessageCountAsync(session.GmailService, $"before:{oldDate}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Gmail stats for user {Email}", session.Email);
        }

        return stats;
    }

    public async Task<CleanupResponse> CleanupAsync(UserSession session, CleanupRequest request)
    {
        var response = new CleanupResponse { Success = true };
        var details = new CleanupDetails();

        try
        {
            if (request.CleanUnread)
            {
                _logger.LogInformation("Cleaning unread emails for {Email}", session.Email);
                details.UnreadDeleted = await DeleteMessagesAsync(session.GmailService, "is:unread");
            }

            if (request.CleanSpam)
            {
                _logger.LogInformation("Cleaning spam for {Email}", session.Email);
                details.SpamDeleted = await EmptySpamAsync(session.GmailService);
            }

            if (request.CleanTrash)
            {
                _logger.LogInformation("Cleaning trash for {Email}", session.Email);
                details.TrashDeleted = await EmptyTrashAsync(session.GmailService);
            }

            if (request.CleanOldEmails)
            {
                _logger.LogInformation("Cleaning old emails for {Email}", session.Email);
                var oldDate = DateTime.UtcNow.AddMonths(-request.OldEmailsMonths).ToString("yyyy/MM/dd");
                details.OldEmailsDeleted = await DeleteMessagesAsync(session.GmailService, $"before:{oldDate}");
            }

            response.Details = details;
            response.TotalDeleted = details.UnreadDeleted + details.SpamDeleted + details.TrashDeleted + details.OldEmailsDeleted;
            response.Message = $"Successfully deleted {response.TotalDeleted} emails";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up emails for {Email}", session.Email);
            response.Success = false;
            response.Message = "Error cleaning up emails: " + ex.Message;
        }

        return response;
    }

    private async Task<int> GetMessageCountAsync(GmailService service, string query)
    {
        try
        {
            var messageIds = await GetAllMessageIdsAsync(service, query);
            return messageIds.Count;
        }
        catch
        {
            return 0;
        }
    }

    private async Task<int> DeleteMessagesAsync(GmailService service, string query)
    {
        var messageIds = await GetAllMessageIdsAsync(service, query);

        if (messageIds.Count == 0)
            return 0;

        // Delete in batches of 1000
        const int batchSize = 1000;
        var totalDeleted = 0;

        for (int i = 0; i < messageIds.Count; i += batchSize)
        {
            var batch = messageIds.Skip(i).Take(batchSize).ToList();

            try
            {
                var batchDeleteRequest = new BatchDeleteMessagesRequest
                {
                    Ids = batch
                };

                await service.Users.Messages.BatchDelete(batchDeleteRequest, "me").ExecuteAsync();
                totalDeleted += batch.Count;

                _logger.LogInformation("Deleted batch of {Count} messages", batch.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting batch of messages");
            }
        }

        return totalDeleted;
    }

    private async Task<List<string>> GetAllMessageIdsAsync(GmailService service, string query)
    {
        var messageIds = new List<string>();

        try
        {
            string? pageToken = null;

            do
            {
                var request = service.Users.Messages.List("me");
                request.Q = query;
                request.MaxResults = 500;
                request.PageToken = pageToken;

                var response = await request.ExecuteAsync();

                if (response.Messages != null)
                {
                    messageIds.AddRange(response.Messages.Select(m => m.Id));
                }

                pageToken = response.NextPageToken;

            } while (!string.IsNullOrEmpty(pageToken));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting message IDs");
        }

        return messageIds;
    }

    private async Task<int> EmptySpamAsync(GmailService service)
    {
        try
        {
            var messageIds = await GetAllMessageIdsAsync(service, "in:spam");

            if (messageIds.Count == 0)
                return 0;

            // Permanently delete spam messages
            foreach (var messageId in messageIds)
            {
                try
                {
                    await service.Users.Messages.Delete("me", messageId).ExecuteAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error deleting spam message {MessageId}", messageId);
                }
            }

            return messageIds.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error emptying spam");
            return 0;
        }
    }

    private async Task<int> EmptyTrashAsync(GmailService service)
    {
        try
        {
            var messageIds = await GetAllMessageIdsAsync(service, "in:trash");

            if (messageIds.Count == 0)
                return 0;

            // Permanently delete trash messages
            foreach (var messageId in messageIds)
            {
                try
                {
                    await service.Users.Messages.Delete("me", messageId).ExecuteAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error deleting trash message {MessageId}", messageId);
                }
            }

            return messageIds.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error emptying trash");
            return 0;
        }
    }

    public async Task<PreviewResponse> GetPreviewAsync(UserSession session, CleanupRequest request)
    {
        var response = new PreviewResponse { Success = true };
        var allGroups = new List<EmailGroup>();

        try
        {
            var queries = new List<(string query, string category)>();

            if (request.CleanUnread)
                queries.Add(("is:unread", "unread"));

            if (request.CleanSpam)
                queries.Add(("in:spam", "spam"));

            if (request.CleanTrash)
                queries.Add(("in:trash", "trash"));

            if (request.CleanOldEmails)
            {
                var oldDate = DateTime.UtcNow.AddMonths(-request.OldEmailsMonths).ToString("yyyy/MM/dd");
                queries.Add(($"before:{oldDate}", "old"));
            }

            foreach (var (query, category) in queries)
            {
                _logger.LogInformation("Getting preview for category: {Category}", category);
                var messageIds = await GetAllMessageIdsAsync(session.GmailService, query);

                if (messageIds.Count == 0)
                    continue;

                var groups = await GroupMessagesBySenderAsync(session.GmailService, messageIds, category);
                allGroups.AddRange(groups);
            }

            response.Groups = allGroups;
            response.TotalEmails = allGroups.Sum(g => g.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting preview for user {Email}", session.Email);
            response.Success = false;
            response.Message = "Error loading preview: " + ex.Message;
        }

        return response;
    }

    private async Task<List<EmailGroup>> GroupMessagesBySenderAsync(GmailService service, List<string> messageIds, string category)
    {
        const int batchSize = 50; // Balanced batch size to optimize speed while avoiding rate limiting
        const int maxRetries = 3;
        const int baseDelayMs = 1000;

        var groups = new Dictionary<string, EmailGroup>();

        try
        {
            _logger.LogInformation("Processing {Count} emails for grouping", messageIds.Count);

            for (int i = 0; i < messageIds.Count; i += batchSize)
            {
                var batch = messageIds.Skip(i).Take(batchSize).ToList();

                // Process batch in parallel
                var tasks = batch.Select(async messageId =>
                {
                    for (int retry = 0; retry <= maxRetries; retry++)
                    {
                        try
                        {
                            var request = service.Users.Messages.Get("me", messageId);
                            request.Format = UsersResource.MessagesResource.GetRequest.FormatEnum.Metadata;
                            request.MetadataHeaders = new Google.Apis.Util.Repeatable<string>(new[] { "From" });

                            var message = await request.ExecuteAsync();
                            var fromHeader = message.Payload?.Headers?.FirstOrDefault(h => h.Name.Equals("From", StringComparison.OrdinalIgnoreCase));
                            var sender = fromHeader?.Value ?? "Unknown Sender";
                            var senderEmail = ExtractEmail(sender);

                            return new { MessageId = messageId, Sender = sender, SenderEmail = senderEmail };
                        }
                        catch (Google.GoogleApiException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.TooManyRequests)
                        {
                            if (retry < maxRetries)
                            {
                                var delay = baseDelayMs * (int)Math.Pow(2, retry);
                                _logger.LogWarning("Rate limit hit for message {MessageId}, retrying in {Delay}ms (attempt {Retry}/{MaxRetries})",
                                    messageId, delay, retry + 1, maxRetries);
                                await Task.Delay(delay);
                            }
                            else
                            {
                                _logger.LogError("Failed to process message {MessageId} after {MaxRetries} retries due to rate limiting",
                                    messageId, maxRetries);
                                return null;
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Error processing message {MessageId}", messageId);
                            return null;
                        }
                    }
                    return null;
                });

                var results = await Task.WhenAll(tasks);

                foreach (var result in results.Where(r => r != null))
                {
                    var groupKey = result.SenderEmail;

                    if (!groups.ContainsKey(groupKey))
                    {
                        groups[groupKey] = new EmailGroup
                        {
                            GroupName = result.Sender,
                            GroupType = "sender",
                            Category = category,
                            Count = 0,
                            MessageIds = new List<string>(),
                            Description = $"Emails from {result.SenderEmail}",
                            Selected = true
                        };
                    }

                    groups[groupKey].Count++;
                    groups[groupKey].MessageIds.Add(result.MessageId);
                }

                _logger.LogInformation("Grouped batch {Current}/{Total} emails", Math.Min(i + batchSize, messageIds.Count), messageIds.Count);

                // Add delay between batches to avoid rate limiting
                if (i + batchSize < messageIds.Count)
                {
                    await Task.Delay(500);
                }
            }

            _logger.LogInformation("Completed grouping {Total} emails into {GroupCount} sender groups", messageIds.Count, groups.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error grouping messages");
        }

        return groups.Values.OrderByDescending(g => g.Count).ToList();
    }

    private string ExtractEmail(string fromHeader)
    {
        var match = System.Text.RegularExpressions.Regex.Match(fromHeader, @"<(.+?)>");
        return match.Success ? match.Groups[1].Value : fromHeader;
    }
}
