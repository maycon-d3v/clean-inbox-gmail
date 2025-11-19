"""
Gmail Unread Emails Deletion Script
This script uses Gmail API to delete all unread emails from your inbox.
"""

import os
import sys
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.pickle
SCOPES = ['https://mail.google.com/']

def authenticate_gmail():
    """
    Authenticate and return Gmail API service
    """
    creds = None

    # The file token.pickle stores the user's access and refresh tokens
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)

    # If there are no (valid) credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                print("ERROR: credentials.json file not found!")
                print("Please download it from Google Cloud Console:")
                print("1. Go to https://console.cloud.google.com/")
                print("2. Create a new project or select existing one")
                print("3. Enable Gmail API")
                print("4. Create OAuth 2.0 credentials (Desktop app)")
                print("5. Download the credentials.json file")
                return None

            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    try:
        service = build('gmail', 'v1', credentials=creds)
        return service
    except HttpError as error:
        print(f'An error occurred: {error}')
        return None

def get_unread_message_ids(service):
    """
    Get all unread message IDs
    """
    print("Searching for unread emails...")
    message_ids = []

    try:
        # Get all unread messages
        results = service.users().messages().list(
            userId='me',
            q='is:unread',
            maxResults=500
        ).execute()

        messages = results.get('messages', [])
        message_ids.extend([msg['id'] for msg in messages])

        # Handle pagination
        while 'nextPageToken' in results:
            page_token = results['nextPageToken']
            results = service.users().messages().list(
                userId='me',
                q='is:unread',
                maxResults=500,
                pageToken=page_token
            ).execute()

            messages = results.get('messages', [])
            message_ids.extend([msg['id'] for msg in messages])
            print(f"Found {len(message_ids)} unread emails so far...")

        return message_ids

    except HttpError as error:
        print(f'An error occurred while fetching messages: {error}')
        return []

def delete_messages_batch(service, message_ids, auto_confirm=False):
    """
    Delete messages in batches
    """
    if not message_ids:
        print("No unread emails found.")
        return

    print(f"\nTotal unread emails found: {len(message_ids)}")

    # Ask for confirmation
    if auto_confirm:
        print("\nAuto-confirm enabled. Proceeding with deletion...")
        confirmation = 'yes'
    else:
        confirmation = input(f"\nAre you sure you want to delete {len(message_ids)} unread emails? (yes/no): ")

    if confirmation.lower() not in ['yes', 'y']:
        print("Operation cancelled.")
        return

    print("\nDeleting emails...")

    # Delete in batches of 1000 (Gmail API limit)
    batch_size = 1000
    total_deleted = 0

    for i in range(0, len(message_ids), batch_size):
        batch = message_ids[i:i + batch_size]

        try:
            # Use batchDelete for efficiency
            service.users().messages().batchDelete(
                userId='me',
                body={'ids': batch}
            ).execute()

            total_deleted += len(batch)
            print(f"Deleted {total_deleted}/{len(message_ids)} emails...")

        except HttpError as error:
            print(f'An error occurred while deleting batch: {error}')
            # Continue with next batch even if one fails
            continue

    print(f"\nSuccessfully deleted {total_deleted} unread emails!")

def main():
    """
    Main function
    """
    print("=" * 60)
    print("Gmail Unread Emails Deletion Script")
    print("=" * 60)
    print()

    # Check for --yes flag
    auto_confirm = '--yes' in sys.argv or '-y' in sys.argv

    # Authenticate
    service = authenticate_gmail()

    if not service:
        print("Failed to authenticate with Gmail API.")
        return

    print("Successfully authenticated!")
    print()

    # Get unread message IDs
    message_ids = get_unread_message_ids(service)

    # Delete messages
    delete_messages_batch(service, message_ids, auto_confirm)

if __name__ == '__main__':
    main()
