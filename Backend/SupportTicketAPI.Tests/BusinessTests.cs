using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SupportTicketAPI.Data;
using SupportTicketAPI.DTOs;
using SupportTicketAPI.Models;
using SupportTicketAPI.Services;
using Xunit;

namespace SupportTicketAPI.Tests;

public class BusinessTests
{
    private DbContextOptions<AppDbContext> CreateNewContextOptions()
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    [Theory]
    [InlineData(TicketPriority.Critical, 2)]
    [InlineData(TicketPriority.High, 8)]
    [InlineData(TicketPriority.Medium, 24)]
    [InlineData(TicketPriority.Low, 72)]
    public void CalculateDeadline_ShouldMatchPriorityHours(TicketPriority priority, int expectedHours)
    {
        var slaService = new SlaService();
        var createdAt = DateTime.UtcNow;
        var deadline = slaService.CalculateDeadline(priority, createdAt);
        var difference = deadline - createdAt;
        Assert.Equal(expectedHours, difference.TotalHours);
    }

    [Fact]
    public void IsBreached_ShouldDetectOverdueDeadline()
    {
        var slaService = new SlaService();
        var pastDeadline = DateTime.UtcNow.AddMinutes(-5);
        var futureDeadline = DateTime.UtcNow.AddMinutes(5);

        Assert.True(slaService.IsBreached(pastDeadline));
        Assert.False(slaService.IsBreached(futureDeadline));
    }

    [Fact]
    public async Task UpdateStatus_ShouldCreateHistoryRecord()
    {
        var options = CreateNewContextOptions();
        using var context = new AppDbContext(options);
        var slaService = new SlaService();
        var service = new TicketService(context, slaService);

        var customer = new User { Id = 1, Name = "Customer 1", Role = UserRole.Customer };
        var agent = new User { Id = 2, Name = "Agent 2", Role = UserRole.Agent };
        context.Users.AddRange(customer, agent);

        var ticket = new Ticket
        {
            Id = 1,
            Title = "Test",
            Status = TicketStatus.Open,
            CreatedByUserId = 1,
            SlaDeadline = DateTime.UtcNow.AddHours(2)
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        var updateDto = new UpdateStatusDto("InProgress", "Starting investigation");
        var result = await service.UpdateStatusAsync(1, updateDto, 2);

        Assert.NotNull(result);
        Assert.Equal("InProgress", result.Status);

        var history = await context.TicketHistories.FirstOrDefaultAsync(h => h.TicketId == 1);
        Assert.NotNull(history);
        Assert.Equal(TicketStatus.Open, history.OldStatus);
        Assert.Equal(TicketStatus.InProgress, history.NewStatus);
        Assert.Equal("Starting investigation", history.Note);
        Assert.Equal(2, history.ChangedByUserId);
    }

    [Fact]
    public async Task UpdateStatus_ClosedTicket_ShouldThrowInvalidOperationException()
    {
        var options = CreateNewContextOptions();
        using var context = new AppDbContext(options);
        var slaService = new SlaService();
        var service = new TicketService(context, slaService);

        var ticket = new Ticket
        {
            Id = 1,
            Title = "Test",
            Status = TicketStatus.Closed,
            CreatedByUserId = 1,
            SlaDeadline = DateTime.UtcNow.AddHours(2)
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        var updateDto = new UpdateStatusDto("Open", "Reopening");
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateStatusAsync(1, updateDto, 2));
    }

    [Fact]
    public async Task UpdateStatus_InvalidTransition_ShouldThrowInvalidOperationException()
    {
        var options = CreateNewContextOptions();
        using var context = new AppDbContext(options);
        var slaService = new SlaService();
        var service = new TicketService(context, slaService);

        var ticket = new Ticket
        {
            Id = 1,
            Title = "Test",
            Status = TicketStatus.Open,
            CreatedByUserId = 1,
            SlaDeadline = DateTime.UtcNow.AddHours(2)
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        var updateDto = new UpdateStatusDto("Resolved", "Fast resolve");
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateStatusAsync(1, updateDto, 2));
    }

    [Fact]
    public async Task AddComment_OtherCustomerTicket_ShouldThrowUnauthorizedAccessException()
    {
        var options = CreateNewContextOptions();
        using var context = new AppDbContext(options);
        var slaService = new SlaService();
        var service = new TicketService(context, slaService);

        var ticket = new Ticket
        {
            Id = 1,
            Title = "Test",
            Status = TicketStatus.Open,
            CreatedByUserId = 10,
            SlaDeadline = DateTime.UtcNow.AddHours(2)
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        var commentDto = new AddCommentDto("Cheating access");
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.AddCommentAsync(1, commentDto, 20, "Customer"));
    }

    [Fact]
    public async Task GetTicketById_OtherCustomerTicket_ShouldReturnNull()
    {
        var options = CreateNewContextOptions();
        using var context = new AppDbContext(options);
        var slaService = new SlaService();
        var service = new TicketService(context, slaService);

        var user = new User { Id = 10, Name = "Alice" };
        var ticket = new Ticket
        {
            Id = 1,
            Title = "Test",
            Status = TicketStatus.Open,
            CreatedByUserId = 10,
            SlaDeadline = DateTime.UtcNow.AddHours(2),
            CreatedBy = user
        };
        context.Users.Add(user);
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        var result = await service.GetTicketByIdAsync(1, 20, "Customer");
        Assert.Null(result);
    }
}
