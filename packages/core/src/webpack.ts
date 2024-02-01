import type { UserOptions } from './core/plugin'
import { plugin } from './core/plugin'

export default plugin.webpack as (opts: UserOptions) => any
