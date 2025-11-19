FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["GmailCleanup.API.csproj", "./"]
RUN dotnet restore "GmailCleanup.API.csproj"
COPY . .
RUN dotnet build "GmailCleanup.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "GmailCleanup.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "GmailCleanup.API.dll"]
