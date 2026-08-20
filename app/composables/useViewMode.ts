export type ViewMode = 'overview' | 'detail'

export function useViewMode() {
  const viewMode = useState<ViewMode>('viewMode', () => 'overview')
  return { viewMode }
}
