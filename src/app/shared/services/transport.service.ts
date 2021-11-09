import {Injectable} from '@angular/core'

import {LocalizeService} from '@app/shared/services/localize.service'
import {TransportItem} from '@app/shared/models/transport.model'

@Injectable()
export class TransportService {

  public readonly imgPath: string = 'assets/icons/transports/'

  constructor(
    private localizeSvc: LocalizeService
  ) {
  }

  public get transports(): TransportItem[] {
    return [
      {
        type: 'car',
        name: this.localizeSvc.translate('TRANSPORTS.CAR'),
        img: 'car.svg'
      },
      {
        type: 'bus',
        name: this.localizeSvc.translate('TRANSPORTS.BUS'),
        img: 'bus.png'
      },
      {
        type: 'bicycle',
        name: this.localizeSvc.translate('TRANSPORTS.BICYCLE'),
        img: 'bicycle.svg'
      },
      {
        type: 'motorcycle',
        name: this.localizeSvc.translate('TRANSPORTS.MOTORCYCLE'),
        img: 'motorcycle.svg'
      },
      {
        type: 'pedestrian',
        name: this.localizeSvc.translate('TRANSPORTS.PEDESTRIAN'),
        img: 'pedestrian.png'
      },
      {
        type: 'taxi',
        name: this.localizeSvc.translate('TRANSPORTS.TAXI'),
        img: 'taxi.svg'
      },
      {
        type: 'truck',
        name: this.localizeSvc.translate('TRANSPORTS.TRUCK'),
        img: 'truck.svg'
      },
      {
        type: 'van',
        name: this.localizeSvc.translate('TRANSPORTS.VAN'),
        img: 'van.svg'
      }
    ]
  }

}
