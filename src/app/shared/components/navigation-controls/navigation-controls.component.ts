import {Component, OnInit} from '@angular/core'

import {MapService, ModalsService, NavigatorService, StorageService} from '@app/shared/services'
import {ROUTE_LOG} from '@app/shared/constants'

@Component({
  selector: 'app-navigation-controls',
  templateUrl: './navigation-controls.component.html',
  styleUrls: ['./navigation-controls.component.scss']
})
export class NavigationControlsComponent implements OnInit {

  constructor(
    public mapSvc: MapService,
    public navigatorSvc: NavigatorService,
    private modalsSvc: ModalsService,
    private storageSvc: StorageService
  ) {
  }

  ngOnInit() {
  }

  public changeLookLocationStatus(): void {
    if (this.mapSvc.isSetCenter$.value || !this.mapSvc.map) return
    const prevValue: boolean = this.mapSvc.isSetCenter$.value
    this.mapSvc.isSetCenter$.next(!prevValue)
  }

  public showRouteModal(): void {
    if (!this.mapSvc.map || this.navigatorSvc.isNavigatorInit) return
    this.modalsSvc.isShowRouteOptionsModal = true
  }

  public closeFromNavigator(): void {
    if (!this.navigatorSvc.isNavigatorInit) return
    this.storageSvc.remove(ROUTE_LOG)
    this.navigatorSvc.destroyNavigator()
  }

  public showSelectLangModal(): void {
    this.modalsSvc.isShowSelectLangModal = true
  }

}
