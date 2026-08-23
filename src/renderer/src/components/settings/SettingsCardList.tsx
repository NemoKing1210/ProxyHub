import { Stack } from '@mui/material'
import { Children, cloneElement, isValidElement, type ReactNode } from 'react'
import { getListCardPosition, getListCardRadius } from '../../lib/card-list'
import ContentSection from '../ui/ContentSection'
import ProxyFormSection from '../proxy/ProxyFormSection'
import SettingsSwitchSection from './SettingsSwitchSection'

interface SettingsCardListProps {
  children: ReactNode
}

/**
 * Dense list of subpage cards stitched with positional radii like proxy
 * lists. `listRadius` is only passed to card components (ContentSection /
 * ProxyFormSection / SettingsSwitchSection); other elements (conditional
 * false/null, fragments) pass through unchanged.
 */
const CARD_TYPES = new Set<unknown>([ContentSection, ProxyFormSection, SettingsSwitchSection])

function SettingsCardList({ children }: SettingsCardListProps): React.JSX.Element {
  const items = Children.toArray(children).filter(Boolean)

  return (
    <Stack spacing={0.75}>
      {items.map((child, index) => {
        if (!isValidElement(child) || !CARD_TYPES.has(child.type)) {
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
