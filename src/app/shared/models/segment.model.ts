import {Instruction} from '@app/shared/models/instruction.model'

export interface Segment {
  h: number
  instruction: Instruction
  distance?: number
  maneuver?: string | null
}
