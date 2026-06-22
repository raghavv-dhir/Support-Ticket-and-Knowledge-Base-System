using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SupportTicketAPI.Data;
using SupportTicketAPI.Interfaces;
using SupportTicketAPI.Repositories;
using SupportTicketAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// ── ensure environment variables override appsettings ──
builder.Configuration.AddEnvironmentVariables();

// ── database setup ──
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var mysqlHost = Environment.GetEnvironmentVariable("MYSQLHOST");
if (!string.IsNullOrEmpty(mysqlHost))
{
    var mysqlPort = Environment.GetEnvironmentVariable("MYSQLPORT") ?? "3306";
    var mysqlUser = Environment.GetEnvironmentVariable("MYSQLUSER");
    var mysqlPassword = Environment.GetEnvironmentVariable("MYSQLPASSWORD");
    var mysqlDatabase = Environment.GetEnvironmentVariable("MYSQLDATABASE");
    var mysqlSsl      = Environment.GetEnvironmentVariable("MYSQLSSL") ?? 
                       (mysqlHost.Contains("aivencloud.com") ? "Required" : "Preferred");

    connectionString = $"Server={mysqlHost};Port={mysqlPort};Database={mysqlDatabase};User={mysqlUser};Password={mysqlPassword};SslMode={mysqlSsl};";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySQL(connectionString!));

// ── jwt auth setup ──
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

// crash early if secrets were not replaced
if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Contains("__SET_VIA_ENV"))
{
    throw new InvalidOperationException(
        "JWT SecretKey is not configured. Set it via environment variable " +
        "'JwtSettings__SecretKey' or in appsettings.Development.json.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtSettings["Issuer"],
            ValidAudience            = jwtSettings["Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization();

// ── rate limiting ──
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // strict policy for auth endpoints (5 req / 60s per IP)
    options.AddPolicy("auth", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        factory: partition => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window      = TimeSpan.FromSeconds(60),
            QueueLimit  = 0
        }));

    // general policy for API endpoints (60 req / 60s per IP)
    options.AddPolicy("api", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        factory: partition => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window      = TimeSpan.FromSeconds(60),
            QueueLimit  = 2
        }));
});

// ── repositories ──
builder.Services.AddScoped<IUserRepository,      UserRepository>();
builder.Services.AddScoped<ITicketRepository,    TicketRepository>();
builder.Services.AddScoped<IKbRepository,        KbRepository>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();

// ── services ──
builder.Services.AddScoped<IAuthService,      AuthService>();
builder.Services.AddScoped<IUserService,      UserService>();
builder.Services.AddScoped<ISlaService,       SlaService>();
builder.Services.AddScoped<ITicketService,    TicketService>();
builder.Services.AddScoped<IKbService,        KbService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// ── controllers ──
builder.Services.AddControllers();

// ── swagger setup ──
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "Support Ticket API",
        Version     = "v1",
        Description = "Support Ticket and Knowledge Base System"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Enter your JWT token. Example: Bearer {token}"
    });

    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

// ── cors setup ──
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ── configure port binding for railway ──
var port = Environment.GetEnvironmentVariable("PORT") ?? "5209";
builder.WebHost.UseUrls($"http://*:{port}");

var app = builder.Build();

// ── run migrations ──
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Support Ticket API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
