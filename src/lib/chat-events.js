export const CHAT_DRAWER_OPEN_EVENT = 'daker:chat-drawer-open'
export const CHAT_ROOMS_UPDATED_EVENT = 'daker:chat-rooms-updated'

export function openChatDrawer(hackathonId = null) {
  window.dispatchEvent(
    new CustomEvent(CHAT_DRAWER_OPEN_EVENT, {
      detail: { hackathonId },
    }),
  )
}

export function notifyChatRoomsUpdated(hackathonId = null) {
  window.dispatchEvent(
    new CustomEvent(CHAT_ROOMS_UPDATED_EVENT, {
      detail: { hackathonId },
    }),
  )
}
