using GmailCleanup.API.Models;
using GmailCleanup.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure to listen on the PORT environment variable (for Render.com)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Google OAuth settings
var googleOAuthSettings = new GoogleOAuthSettings
{
    ClientId = builder.Configuration["Google:ClientId"] ?? "",
    ClientSecret = builder.Configuration["Google:ClientSecret"] ?? "",
    RedirectUri = builder.Configuration["Google:RedirectUri"] ?? "http://localhost:5000/api/auth/callback"
};

builder.Services.AddSingleton(googleOAuthSettings);

// Register services
builder.Services.AddSingleton<SessionManager>();
builder.Services.AddSingleton<GoogleAuthService>();
builder.Services.AddScoped<GmailCleanupService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:3000", "http://localhost:5173" };

        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add background service to clean expired sessions
builder.Services.AddHostedService<SessionCleanupBackgroundService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

app.Run();

// Background service to clean expired sessions
public class SessionCleanupBackgroundService : BackgroundService
{
    private readonly SessionManager _sessionManager;
    private readonly ILogger<SessionCleanupBackgroundService> _logger;

    public SessionCleanupBackgroundService(SessionManager sessionManager, ILogger<SessionCleanupBackgroundService> logger)
    {
        _sessionManager = sessionManager;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Cleaning expired sessions");
            _sessionManager.CleanExpiredSessions();
            await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
        }
    }
}
