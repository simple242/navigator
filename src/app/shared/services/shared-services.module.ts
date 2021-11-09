import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'

import {AppService} from '@app/shared/services/app.service'
import {MapService} from '@app/shared/services/map.service'
import {NavigatorService} from '@app/shared/services/navigator.service'
import {UiService} from '@app/shared/services/ui.service'
import {ModalsService} from '@app/shared/services/modals.service'
import {FormControlsService} from '@app/shared/services/form-controls.service'
import {StorageService} from '@app/shared/services/storage.service'
import {LocalizeService} from '@app/shared/services/localize.service'
import {TransportService} from '@app/shared/services/transport.service'
import {UtilsService} from '@app/shared/services/utils.service'
import {AlertService} from '@app/shared/services/alert.service'
import {PermissionsService} from '@app/shared/services/permissions.service'

@NgModule({
  declarations: [],
  providers: [
    AppService,
    MapService,
    NavigatorService,
    UiService,
    ModalsService,
    FormControlsService,
    StorageService,
    LocalizeService,
    TransportService,
    UtilsService,
    AlertService,
    PermissionsService
  ],
  imports: [
    CommonModule
  ],
  exports: []
})
export class SharedServicesModule {
}
