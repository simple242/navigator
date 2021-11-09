import {MapEvent, Marker} from '@tomtom-international/web-sdk-maps'
import {SearchResult} from '@tomtom-international/web-sdk-services'

import {Coords} from '@app/shared/models/coords.model'
import {Callback} from '@app/shared/models/callback.model'

export interface MarkerCreateParameters {
  id: string
  cssClass?: string
  imageUrl?: string
  center?: Coords
}

export interface MapIcon {
  cssClass?: string
  imageUrl: string
}

export interface MapMarker {
  marker: Marker
  wasAdded: boolean
  id: string
}

export interface MapEventParams {
  name: MapEventKey
  listener: Callback
}

export type MapEventKey = keyof MapEvent

export interface SearchResultItem {
  item: SearchResult
  fullAddress: string
  city: string
}

export interface CurrentPositionItem {
  type: 'current-position'
  name: string
  position: Coords
}

export type ttGeoJson =  any
