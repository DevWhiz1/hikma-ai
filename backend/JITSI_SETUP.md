# Jitsi Meet Integration Setup

## Custom Jitsi Meet Domain Configuration

This application uses a custom Jitsi Meet instance hosted at **hikmameet.live** for video conferencing.

## Configuration

### Environment Variable

Add the following to your `.env` file in the backend directory:

```env
JITSI_DOMAIN=hikmameet.live
```

If not set, the system will default to `hikmameet.live`.

### How It Works

1. **Meeting Link Generation**: When a meeting is scheduled or needs to start, the system generates a unique room ID and creates a link to your Jitsi instance.

2. **Link Format**: `https://hikmameet.live/HikmaAI-[random-room-id]`

3. **Auto-Detection**: The frontend automatically recognizes links from `hikmameet.live` as valid meeting links.

## Files Modified

### Backend
- `backend/controllers/meetingController.js` - Updated `generateJitsiLink()` function to use custom domain

### Frontend
- `client/src/components/user/Chat/MeetingChat.tsx` - Added `hikmameet.live` to meeting link patterns
- `client/src/components/user/Chat/ChatBot.tsx` - Added `hikmameet.live` to meeting link patterns

## Testing

1. Schedule a meeting between a scholar and student
2. The system will generate a link like: `https://hikmameet.live/HikmaAI-a1b2c3d4e5f6`
3. When clicked, users will be redirected to your custom Jitsi Meet instance

## Jitsi Meet Server Requirements

Your Jitsi Meet server at `hikmameet.live` should be configured to:
- Allow room creation via URL
- Support HTTPS
- Have proper firewall rules for video/audio streaming
- Support guest access (if you don't require authentication)

## Troubleshooting

### Links not working
- Verify your Jitsi server is accessible at `https://hikmameet.live`
- Check SSL certificate is valid
- Ensure firewall allows necessary ports (443, 10000 UDP, 4443 TCP)

### Meetings not starting
- Check the JITSI_DOMAIN environment variable is set correctly
- Verify the backend server has restarted after configuration changes
- Check browser console for any errors

## Additional Configuration

If you want to customize the room prefix, edit the `generateJitsiLink()` function in `backend/controllers/meetingController.js`:

```javascript
link: `https://${jitsiDomain}/YourPrefix-${room}`
```

Default prefix is `HikmaAI-` to avoid room name conflicts.

