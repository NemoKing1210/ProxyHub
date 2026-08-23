import { Collapse, type CollapseProps } from '@mui/material'
import { MD3_DURATION, MD3_EASING } from '../../theme'

type RevealCollapseProps = CollapseProps

/**
 * Shared reveal for conditional blocks on settings pages: standardized MD3
 * timings with emphasized curves plus a content fade-in so the block doesn't
 * look jumpy. `mountOnEnter` + `unmountOnExit` by default: hidden sections
 * shouldn't mount their effects (subscriptions, IPC) before opening or stay
 * in the tree after closing.
 */
function RevealCollapse({
  timeout,
  mountOnEnter = true,
  unmountOnExit = true,
  ...rest
}: RevealCollapseProps): React.JSX.Element {
  return (
    <Collapse
      timeout={timeout ?? { enter: MD3_DURATION.medium1, exit: MD3_DURATION.short4 }}
      easing={{
        enter: MD3_EASING.emphasizedDecelerate,
        exit: MD3_EASING.emphasizedAccelerate
      }}
      mountOnEnter={mountOnEnter}
      unmountOnExit={unmountOnExit}
      {...rest}
    />
  )
}

export default RevealCollapse
