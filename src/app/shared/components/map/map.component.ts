import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core'
import {Subject} from 'rxjs'
import {distinctUntilChanged, takeUntil} from 'rxjs/operators'

import {
  AlertService,
  LocalizeService,
  MapService,
  ModalsService,
  NavigatorService,
  PermissionsService,
  StorageService,
  UtilsService
} from '@app/shared/services'
import {Coords, RouteLog} from '@app/shared/models'
import {ROUTE_LOG} from '@app/shared/constants'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('mapRef') private mapRef: ElementRef | null = null

  private destroy$: Subject<boolean> = new Subject<boolean>()

  constructor(
    private mapSvc: MapService,
    private navigatorSvc: NavigatorService,
    private storageSvc: StorageService,
    private modalsSvc: ModalsService,
    private permissionsSvc: PermissionsService,
    private utilsSvc: UtilsService,
    private alertSvc: AlertService,
    private localizeSvc: LocalizeService
  ) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.initializeMap()
  }

  ngOnDestroy() {
    this.destroy$.next(true)
  }

  private async initializeMap(): Promise<void> {
    const isOnline: boolean = this.utilsSvc.isOnline()
    if (!isOnline) {
      this.alertSvc.warningDialog(
        this.localizeSvc.translate('ERRORS.NETWORK.TITLE'),
        this.localizeSvc.translate('ERRORS.NETWORK.TEXT'),
        'error', 10_000
      )
    }

    await this.permissionsSvc.requestGeolocationPermissions()
    this.observeMapCenter()
    const myPosition: GeolocationPosition = await this.mapSvc.getMyPosition()
    const myCoords = this.mapSvc.getCoordsFromPosition(myPosition)

    setTimeout(() => {
      if (!this.mapRef?.nativeElement) {
        console.error('Map container not found!')
        return
      }

      this.mapSvc.initMap(this.mapRef.nativeElement, {center: myCoords})
      this.addMapEvents()

      this.mapSvc.addDefaultUserMarkerToMap(myCoords)
      this.checkActiveRoute()
    }, 100)
  }

  private addMapEvents(): void {
    this.mapSvc.addMapEvent('mouseup', () => {
      if (this.mapSvc.isSetCenter$.value) this.mapSvc.isSetCenter$.next(false)
    })

    this.mapSvc.addMapEvent('touchend', () => {
      if (this.mapSvc.isSetCenter$.value) this.mapSvc.isSetCenter$.next(false)
    })
  }

  private observeMapCenter(): void {
    this.mapSvc.observeMyGeolocation(1000)
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((position: GeolocationPosition) => {
        if (!this.mapSvc.map || this.navigatorSvc.isNavigatorInit) return

        const myPosition: Coords = this.mapSvc.getCoordsFromPosition(position)
        const updateCenter = () => {
          if (this.navigatorSvc.isNavigatorInit) return
          this.mapSvc.updateMapCenter(myPosition)
        }

        if (this.mapSvc.userMarkerId) this.mapSvc.changeMarkerLocation(this.mapSvc.userMarkerId, myPosition)
        if (this.mapSvc.isSetCenter$.value) updateCenter()

        this.mapSvc.isSetCenter$
          .pipe(takeUntil(this.destroy$), distinctUntilChanged())
          .subscribe(res => {
            if (res) updateCenter()
          })
      })
  }

  private checkActiveRoute(): void {
    const routeLog: RouteLog = this.storageSvc.get(ROUTE_LOG)
    if (routeLog?.startCoords && routeLog?.endCoords && routeLog?.transport) {
      this.navigatorSvc.initNavigator(routeLog.startCoords, routeLog.endCoords, routeLog.transport)
      this.modalsSvc.isShowRouteOptionsModal = false
    }
  }

}
