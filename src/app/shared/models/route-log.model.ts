import {Coords} from '@app/shared/models/coords.model'
import {TransportItem} from '@app/shared/models/transport.model'

export interface RouteLog {
  startCoords: Coords
  endCoords: Coords
  transport: TransportItem
}
