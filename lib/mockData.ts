import { positionBetween } from './fractionalIndex'
import type { BoardSnapshot } from '@/types/board'

const p0 = positionBetween(null, null)
const p1 = positionBetween(p0,   null)
const p2 = positionBetween(p1,   null)
const p3 = positionBetween(p2,   null)

const now = Date.now()

export const mockBoardSnapshot: BoardSnapshot = {
  board: {
    id:        'board-1',
    title:     'Engineering Roadmap',
    createdAt: now,
    updatedAt: now,
  },

  columns: [
    { id: 'col-todo',       boardId: 'board-1', title: 'To Do',       position: p0, createdAt: now, updatedAt: now },
    { id: 'col-inprogress', boardId: 'board-1', title: 'In Progress', position: p1, createdAt: now, updatedAt: now },
    { id: 'col-review',     boardId: 'board-1', title: 'In Review',   position: p2, createdAt: now, updatedAt: now },
    { id: 'col-done',       boardId: 'board-1', title: 'Done',        position: p3, createdAt: now, updatedAt: now },
  ],

  cards: [
    // ---- To Do ----
    {
      id: 'card-1', columnId: 'col-todo',
      title: 'Competitor analysis for mobile auth flows',
      description: 'Research and document competitor approaches to mobile authentication.',
      position: p0, createdAt: now, updatedAt: now,
      label: { text: 'Research', variant: 'research' },
      dueDate: '2024-10-24',
      assigneeInitials: 'SL', assigneeHue: 210,
    },
    {
      id: 'card-2', columnId: 'col-todo',
      title: 'Integrate Stripe Connect for marketplace payouts',
      description: 'Add Stripe Connect OAuth flow and payout scheduling.',
      position: p1, createdAt: now, updatedAt: now,
      label: { text: 'Feature', variant: 'feature' },
      dueDate: '2024-10-26',
      assigneeInitials: 'MR', assigneeHue: 160,
    },
    {
      id: 'card-3', columnId: 'col-todo',
      title: 'Redesign onboarding flow',
      description: 'Simplify the 5-step onboarding to 3 steps based on user testing feedback.',
      position: p2, createdAt: now, updatedAt: now,
      label: { text: 'Design', variant: 'design' },
      dueDate: '2024-11-01',
      assigneeInitials: 'PK', assigneeHue: 290,
    },

    // ---- In Progress ----
    {
      id: 'card-4', columnId: 'col-inprogress',
      title: 'Fix layout shift on Safari mobile browsers',
      description: 'CLS score is 0.28 on Safari iOS 17. Isolate and fix the offending layout.',
      position: p0, createdAt: now, updatedAt: now,
      label: { text: 'Bug', variant: 'bug' },
      dueDate: '2024-10-23',
      assigneeInitials: 'AJ', assigneeHue: 30,
    },
    {
      id: 'card-5', columnId: 'col-inprogress',
      title: 'Dark mode support for user dashboard',
      description: 'Implement system-preference-aware dark mode across all dashboard pages.',
      position: p1, createdAt: now, updatedAt: now,
      label: { text: 'Feature', variant: 'feature' },
      dueDate: '2024-10-28',
      assigneeInitials: 'CW', assigneeHue: 340,
    },

    // ---- In Review ----
    {
      id: 'card-6', columnId: 'col-review',
      title: 'Cleanup legacy API utility functions',
      description: 'Remove deprecated wrappers and consolidate into the shared API client.',
      position: p0, createdAt: now, updatedAt: now,
      label: { text: 'Refactor', variant: 'refactor' },
      dueDate: '2024-10-21',
      assigneeInitials: 'BT', assigneeHue: 190,
    },
    {
      id: 'card-7', columnId: 'col-review',
      title: 'Add request rate limiting to public API',
      description: 'Protect public endpoints with per-IP rate limiting via Redis.',
      position: p1, createdAt: now, updatedAt: now,
      label: { text: 'Infrastructure', variant: 'infrastructure' },
      dueDate: '2024-10-25',
      assigneeInitials: 'NV', assigneeHue: 50,
    },

    // ---- Done ----
    {
      id: 'card-8', columnId: 'col-done',
      title: 'Migrate DB to RDS Aurora Cluster',
      description: 'Zero-downtime migration from single RDS instance to Aurora serverless v2.',
      position: p0, createdAt: now, updatedAt: now,
      label: { text: 'Infrastructure', variant: 'infrastructure' },
      dueDate: '2024-10-15',
      assigneeInitials: 'DK', assigneeHue: 130,
    },
    {
      id: 'card-9', columnId: 'col-done',
      title: 'Set up CI/CD pipeline',
      description: 'GitHub Actions with staging deploy, smoke tests, and Slack alerts.',
      position: p1, createdAt: now, updatedAt: now,
      label: { text: 'Infrastructure', variant: 'infrastructure' },
      dueDate: '2024-10-10',
      assigneeInitials: 'SL', assigneeHue: 210,
    },
  ],
}
