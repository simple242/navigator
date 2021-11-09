import {Coords} from '@app/shared/models/coords.model'

export interface Instruction {
  startLocation: Coords
  endLocation: Coords
  currentStreet: string
  nextStreet: string | null
  maneuver: string
}
