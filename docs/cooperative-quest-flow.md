# Cooperative Quest Flow

This document describes the complete flow of cooperative quests in emberglow, from invitation creation to quest completion. The flow is designed to be easily converted into a flowchart diagram.

## Overview

Cooperative quests allow multiple users to complete a quest together. All participants must keep their phones locked for the entire duration - if anyone unlocks early, everyone fails together.

## Main Flow Stages

### 1. Quest Creation & Invitation

**User Action**: Creator opens Cooperative Quest Menu
- **UI**: `/cooperative-quest-menu` screen
- **WebSocket**: Connects to server (if not already connected)

**User Action**: Creator selects "Create New Quest"
- **UI**: `/cooperative-quest-create` screen

**User Action**: Creator fills quest details (title, duration, category)
- **Input**: Quest title, duration (5-60 minutes), category selection

**User Action**: Creator submits quest
- **API Request**: `POST /v1/invitations/cooperative`
  - **Body**: 
    ```json
    {
      "questData": {
        "title": "Quest Title",
        "duration": 30,
        "category": "social"
      },
      "invitedUserIds": ["userId1", "userId2"]
    }
    ```
  - **Response**: 
    ```json
    {
      "invitation": {
        "id": "invitationId",
        "status": "pending",
        "expiresAt": "2024-01-01T00:00:00Z"
      }
    }
    ```

**System Action**: Server creates invitation
- Creates invitation record with 5-minute expiry
- **Push Notification**: Sends to all invited users via OneSignal

### 2. Invitation Response Flow

**User Action**: Invitee receives push notification
- **UI**: Notification appears on device
- **Deep Link**: `unquest://cooperative-quest-invitation/{invitationId}`

**User Action**: Invitee opens app from notification
- **UI**: `/cooperative-quest-menu` screen
- **API Request**: `GET /v1/invitations` (fetch pending invitations)

**User Action**: Invitee views invitation
- **UI**: Invitation card shows inviter name, quest title, duration

**User Action**: Invitee accepts/declines invitation
- **API Request**: `PATCH /v1/invitations/{invitationId}`
  - **Body**: `{ "action": "accept" }` or `{ "action": "decline" }`
  - **Response**: 
    ```json
    {
      "message": "Invitation accepted successfully",
      "questRunId": null
    }
    ```

**System Action**: Server processes response
- Updates invitation status
- **WebSocket Event**: Emits `invitationAccepted` to lobby room
- **WebSocket Event**: Emits `invitation:{invitationId}:accepted` globally

### 3. Lobby Management

**Creator Flow** (after creating invitation):
- **UI**: Automatically navigates to `/cooperative-quest-lobby/{invitationId}`
- **WebSocket**: Emits `lobby:join` with lobbyId (same as invitationId)
- **WebSocket**: Receives `lobby:joined` event with participant list
- **UI**: Shows participants with pending/accepted status

**Invitee Flow** (after accepting):
- **UI**: Navigates to `/cooperative-quest-lobby/{invitationId}`
- **WebSocket**: Emits `lobby:join` with lobbyId
- **WebSocket**: Receives `lobby:joined` event
- **WebSocket Event**: `lobby:participant-joined` broadcast to all in lobby

**Lobby State Updates**:
- **WebSocket Events**:
  - `invitationAccepted`: Updates participant status
  - `lobby:participant-joined`: Adds new participant to UI
  - `invitation:response`: Updates invitation status

### 4. Ready Check Phase

**Trigger**: All invitations responded OR creator forces start
- **UI**: Lobby automatically transitions to `/cooperative-quest-ready`

**User Action**: Each participant marks ready
- **WebSocket**: Emits `lobby:ready` event
- **WebSocket Event**: `lobby:participant-ready` broadcast to all
- **UI**: Updates ready status indicators

**System Check**: All participants ready
- **Condition**: All accepted participants marked as ready
- **WebSocket Event**: `lobby:all-participants-ready`

### 5. Quest Start

**System Action**: Create quest run
- **API Request**: `POST /v1/quest-runs/cooperative` (automatic)
  - **Body**: Created from lobby data
  - **Response**: Quest run with ID and start time

**WebSocket Event**: `lobby:quest-created`
- Contains questRunId and scheduledStartTime
- All participants receive this event

**UI Flow**: Navigate to countdown
- **UI**: `/cooperative-pending-quest` screen
- Shows synchronized countdown (typically 30 seconds)

**Countdown Complete**:
- **UI**: Automatically navigates to `/cooperative-active-quest`
- **System**: Quest timer begins

### 6. Active Quest Phase

**UI State**: Active quest screen
- Shows quest title, remaining time, participant avatars
- Lock state monitoring begins

**Background Monitoring**:
- **Native Module**: LockState module monitors phone lock status
- **Interval**: Checks every few seconds

**Lock State Events**:
- **Phone Locked**: Normal state, quest continues
- **Phone Unlocked**: 
  - **WebSocket**: Emits `quest:failed` event
  - **API Request**: `PATCH /v1/quest-runs/{questRunId}/fail`

**Periodic Status Updates**:
- **WebSocket**: `quest:heartbeat` events (optional)
- **API**: Status polling every 30 seconds

### 7. Quest Completion

**Success Path** (timer reaches zero, all phones stayed locked):
- **System**: Timer expires
- **API Request**: `POST /v1/quest-runs/{questRunId}/complete`
  - **Response**: XP earned, achievements, etc.
- **UI**: Navigate to `/quest-complete`
- Shows success screen with rewards

**Failure Path** (someone unlocked early):
- **Trigger**: Lock state change detected
- **WebSocket**: Failed user emits `quest:failed`
- **System**: Marks quest as failed for all participants
- **UI**: Navigate to `/quest-failed`
- Shows who unlocked and when

### 8. Post-Quest

**UI Options**:
- View journal entry
- Share results
- Return to home
- Create another cooperative quest

## WebSocket Events Summary

**Invitation Phase**:
- `invitationAccepted`
- `invitation:{id}:accepted`
- `invitationDeclined`

**Lobby Phase**:
- `lobby:join` (client → server)
- `lobby:joined` (server → client)
- `lobby:participant-joined`
- `lobby:participant-ready`
- `lobby:all-participants-ready`
- `lobby:quest-created`

**Quest Phase**:
- `quest:heartbeat`
- `quest:failed`
- `quest:completed`

## Error Handling

**Invitation Expiry**:
- 5-minute timeout
- UI shows "Invitation Expired"
- Cannot be accepted after expiry

**Network Disconnection**:
- WebSocket reconnection attempts
- Quest continues if already started
- May miss real-time updates but can poll status

**App Backgrounding**:
- Quest continues running
- Background timers maintain state
- Lock monitoring continues

## State Synchronization

The system maintains state consistency through:
1. REST API as source of truth
2. WebSocket for real-time updates
3. Local storage for offline resilience
4. Polling as fallback for missed events

## Key Decision Points (for flowchart diamonds)

1. **Has user premium access?** → Show paywall or continue
2. **All invitations responded?** → Transition to ready or wait
3. **All participants ready?** → Start countdown or wait
4. **Phone unlocked during quest?** → Fail quest or continue
5. **Quest timer expired?** → Complete quest or already failed

## Parallel Flows

The following happen simultaneously:
- Push notifications to all invitees
- WebSocket events to connected clients  
- Database updates for state changes
- Local state updates in each client

This document provides a complete overview of the cooperative quest flow, suitable for conversion into a visual flowchart with clear decision points, actions, and system processes.