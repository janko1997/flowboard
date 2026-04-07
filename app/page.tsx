import { redirect } from 'next/navigation'

// Redirect root to the demo board.
// In Phase 2 this becomes a board-picker / dashboard page.
export default function RootPage() {
  redirect('/board/board-1')
}
