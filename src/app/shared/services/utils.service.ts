import {Injectable} from '@angular/core'
import {Platform} from '@ionic/angular'
import cloneDeep from 'lodash.clonedeep'

@Injectable()
export class UtilsService {

  constructor(
    private platform: Platform
  ) {
  }

  public cloneDeep<T>(obj: T): T {
    return cloneDeep(obj)
  }

  public isApple(): boolean {
    return (
      this.platform.is('ios')
      || this.platform.is('ipad')
      || this.platform.is('iphone')
    )
  }

  public isSmartphone(): boolean {
    return this.isApple() || this.platform.is('android')
  }

  public isBrowser(): boolean {
    return (
      this.platform.is('desktop')
      || this.platform.is('mobileweb')
    )
  }

  public isOnline(): boolean {
    return window.navigator.onLine
  }

}
