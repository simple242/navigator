import {Injectable} from '@angular/core'

import {UiService} from '@app/shared/services/ui.service'
import {MapService} from '@app/shared/services/map.service'
import {LocalizeService} from '@app/shared/services/localize.service'

@Injectable()
export class AppService {

  constructor(
    private uiSvc: UiService,
    private mapSvc: MapService,
    private localizeSvc: LocalizeService
  ) {
  }

  public async initializeApp(): Promise<void> {
    this.uiSvc.initializeNgPrime()
    this.localizeSvc.init()
  }

  public async reinitializeApp(): Promise<void> {
    await this.destroyApp()
    await this.initializeApp()
  }

  public async destroyApp(): Promise<void> {

  }

}
