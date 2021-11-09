import {Injectable} from '@angular/core'
import {PrimeNGConfig} from 'primeng/api'

@Injectable()
export class UiService {

  constructor(
    private primengConfig: PrimeNGConfig
  ) {
  }

  public initializeNgPrime(): void {
    this.primengConfig.ripple = true
  }

}
