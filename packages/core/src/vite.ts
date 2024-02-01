import type { UserOptions } from './core/plugin'
import { plugin } from './core/plugin'

export default plugin.vite as (opts: UserOptions) => any
