export const CHAT_DRAWER_OPEN_EVENT = 'daker:chat-drawer-open'

export function openChatDrawer({ hackathonId = null, refreshRooms = false } = {}) {
  window.dispatchEvent(
    new CustomEvent(CHAT_DRAWER_OPEN_EVENT, {
      detail: { hackathonId, refreshRooms },
    }),
  )
}
