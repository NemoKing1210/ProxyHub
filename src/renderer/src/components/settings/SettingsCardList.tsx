import { Stack } from '@mui/material'
import { Children, cloneElement, isValidElement, type ReactNode } from 'react'
import { getListCardPosition, getListCardRadius } from '../../lib/card-list'

interface SettingsCardListProps {
  children: ReactNode
}

/**
 * Dense list of subpage cards stitched with positional radii like proxy
 * lists. `listRadius` is passed to every direct card child so outer seams
 * use 16/6. Non-card elements (false/null) are filtered out.
 */
function SettingsCardList({ children }: SettingsCardListProps): React.JSX.Element {
  const items = Children.toArray(children).filter(Boolean)

  return (
    <Stack spacing={0.75}>
      {items.map((child, index) => {
        if (!isValidElement(child)) {
          return child
        }

        const position = getListCardPosition(index, items.length)
        return cloneElement(child, {
          listRadius: getListCardRadius(position)
        } as Record<string, unknown>)
      })}
    </Stack>
  )
}

export default SettingsCardList
