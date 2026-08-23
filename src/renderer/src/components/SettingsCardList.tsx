import { Stack } from '@mui/material'
import { Children, cloneElement, isValidElement, type ReactNode } from 'react'
import { getListCardPosition, getListCardRadius } from '../utils/card-list'
import ContentSection from './ContentSection'
import ProxyFormSection from './ProxyFormSection'

interface SettingsCardListProps {
  children: ReactNode
}

// Список карточек подстраницы настроек: плотный ряд, «сшитый» позиционными
// радиусами как списки прокси. listRadius прокидывается только карточным
// компонентам (ContentSection / ProxyFormSection), остальные элементы
// (условные false/null, фрагменты) пропускаются без изменений.
const CARD_TYPES = new Set<unknown>([ContentSection, ProxyFormSection])

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
