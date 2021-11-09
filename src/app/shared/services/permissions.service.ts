import {Injectable} from '@angular/core'
import {AndroidPermissions} from '@ionic-native/android-permissions/ngx'
import {Platform} from '@ionic/angular'

import {UtilsService} from '@app/shared/services/utils.service'

@Injectable()
export class PermissionsService {

  constructor(
    private androidPermissions: AndroidPermissions,
    private utilsSvc: UtilsService,
    private platform: Platform
  ) {
  }

  public async requestGeolocationPermissions() {
    try {
      if (!this.utilsSvc.isSmartphone()) return

      await this.platform.ready()

      const permission = await this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION);

      if (!permission?.hasPermission) {
        await this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION]);
      }
    } catch (e) {
      console.error(e)
    }
  }

}
