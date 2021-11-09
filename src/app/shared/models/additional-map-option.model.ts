import {MapOptions} from '@tomtom-international/web-sdk-maps'

export interface AdditionalMapOption extends Partial<Exclude<MapOptions, 'key' | 'container'>> {
}
