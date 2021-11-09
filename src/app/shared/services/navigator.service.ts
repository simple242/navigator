import {Injectable} from '@angular/core'
import {BehaviorSubject, Subject} from 'rxjs'
import {distinctUntilChanged, takeUntil} from 'rxjs/operators'

import {Coords, Instruction, Segment, TransportItem, ttGeoJson} from '@app/shared/models'
import {MapService} from '@app/shared/services/map.service'
import {TransportService} from '@app/shared/services/transport.service'
import {UtilsService} from '@app/shared/services/utils.service'

@Injectable()
export class NavigatorService {

  public navigatorPanelData$: BehaviorSubject<Segment> = new BehaviorSubject<Segment>(<Segment>{})
  public isShowFullPanelData$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  private NAVIGATOR_INIT: boolean = false
  private destroy$: Subject<boolean> = new Subject<boolean>()
  private instructions: Instruction[] = []
  private prevSegmentMinIndex: number = 1
  private routeEndCoords: Coords | null = null
  private currentRoute: ttGeoJson | null = null
  private prevPolylineId: string | null = null
  private coveredPoints: [number, number][] = []

  constructor(
    private mapSvc: MapService,
    private transportSvc: TransportService,
    private utilsSvc: UtilsService
  ) {
  }

  public get isNavigatorInit(): boolean {
    return this.NAVIGATOR_INIT
  }

  private checkAccess(): boolean {
    let isAccess: boolean = true

    if (this.NAVIGATOR_INIT) {
      isAccess = false
    } else {
      this.NAVIGATOR_INIT = true
    }

    return isAccess
  }

  public async initNavigator(startCoords: Coords, endCoords: Coords, transport: TransportItem): Promise<void> {
    if (!this.checkAccess()) return

    this.routeEndCoords = endCoords

    this.mapSvc.setPitch()
    this.mapSvc.setZoom()

    this.mapSvc.isSetCenter$.next(true)

    await this.buildRoute(startCoords, endCoords, transport)
    this.observeUserLocation()
  }

  public destroyNavigator(): void {
    if (!this.NAVIGATOR_INIT) return

    this.NAVIGATOR_INIT = false
    this.destroy$.next(true)

    setTimeout(() => {
      this.mapSvc.setZoom(15)
      this.mapSvc.setPitch(-60)
      this.mapSvc.removeAllMarkers()
      this.mapSvc.removeAllPolylines()
      this.mapSvc.addDefaultUserMarkerToMap()
      this.navigatorPanelData$.next(<Segment>{})
      this.isShowFullPanelData$.next(false)
      this.prevSegmentMinIndex = 1
      this.instructions = []
      this.clearPaintOverRouteCash()
      this.routeEndCoords = null
      this.mapSvc.isSetCenter$.next(true)
    }, 100)
  }

  private async buildRoute(startCoords: Coords, endCoords: Coords, transport: TransportItem): Promise<void> {
    const route = await this.mapSvc.calculateRoute(transport.type, startCoords, endCoords)
    await this.mapSvc.addPolyline(route, `id_${transport.type}`)

    const startMarker = this.mapSvc.createMarker(startCoords, this.mapSvc.mapImages.start.id, {
      imageUrl: this.mapSvc.mapImages.start.src
    })
    if (startMarker) this.mapSvc.addMarkerToMap(startMarker)

    const endMarker = this.mapSvc.createMarker(endCoords, this.mapSvc.mapImages.end.id, {
      imageUrl: this.mapSvc.mapImages.end.src
    })
    if (endMarker) this.mapSvc.addMarkerToMap(endMarker)

    const myPosition: GeolocationPosition = await this.mapSvc.getMyPosition()
    const myCoords = this.mapSvc.getCoordsFromPosition(myPosition)

    const transportMarker = this.mapSvc.createMarker(myCoords, transport.type, {
      imageUrl: this.transportSvc.imgPath + transport.img
    })
    if (transportMarker) this.mapSvc.addUserMarkerToMap(transportMarker)

    this.currentRoute = route
    this.updateInstruction(route)

    await this.rotateNavigatorCamera(
      {lat: route.features[0].geometry.coordinates[0][0], lng: route.features[0].geometry.coordinates[0][1]},
      {lat: route.features[0].geometry.coordinates[1][0], lng: route.features[0].geometry.coordinates[1][1]}
    )
  }

  private observeUserLocation(): void {
    this.mapSvc.observeMyGeolocation(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (res: GeolocationPosition) => {
        if (!this.mapSvc.map) return

        const position: Coords = this.mapSvc.getCoordsFromPosition(res)
        const segments = this.mapSvc.calculateTriangleGeolocation(this.instructions, position) || []
        await this.updateNavigatorPanelData(segments, position)
        if (this.mapSvc.userMarkerId) this.mapSvc.changeMarkerLocation(this.mapSvc.userMarkerId, position)
        this.changeNavigatorCenter(position)
        this.checkDistanceToPointFinish(position)
        this.paintOverRoute(position)
      })
  }

  private changeNavigatorCenter(position: Coords): void {
    if (!this.NAVIGATOR_INIT) return

    const updateCenter = () => {
      if (!this.NAVIGATOR_INIT) return
      this.mapSvc.updateMapCenter(position)
    }

    if (this.mapSvc.isSetCenter$.value) updateCenter()

    this.mapSvc.isSetCenter$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(res => {
        if (res) updateCenter()
      })
  }

  private updateInstruction(route: ttGeoJson): void {
    const routeInstructions: any[] = route?.features[0]?.properties?.guidance?.instructions || []
    routeInstructions.forEach((el, i, arr) => {
      this.instructions.push({
        startLocation: {lat: el.point.latitude, lng: el.point.longitude},
        endLocation: {lat: arr[i + 1]?.point?.latitude, lng: arr[i + 1]?.point?.longitude},
        currentStreet: el.street,
        nextStreet: arr[i + 1]?.street,
        maneuver: arr[i + 1]?.maneuver
      })
    })
  }

  private async rotateNavigatorCamera(startCoords: Coords, endCoords: Coords): Promise<void> {
    const deg: number = this.mapSvc.calculateBearing(startCoords, endCoords)
    await this.mapSvc.rotateCamera(deg)
  }

  private async updateNavigatorPanelData(segments: Segment[], coords: Coords): Promise<void> {
    let minValue = 6371
    let minIndex = -1

    segments.forEach((el, i) => {
      if (el.h < minValue) {
        minValue = el.h
        minIndex = i
      }
    })

    const currentSegment = segments[minIndex]
    if (!currentSegment) return
    currentSegment.distance = this.mapSvc.getDistanceFromLatLonInKm(
      coords?.lat, coords?.lng,
      currentSegment?.instruction?.endLocation?.lat,
      currentSegment?.instruction?.endLocation?.lng
    ) * 1000

    if (currentSegment?.instruction?.maneuver.includes('LEFT')) {
      currentSegment.maneuver = 'left'
    } else if (currentSegment?.instruction?.maneuver.includes('RIGHT')) {
      currentSegment.maneuver = 'right'
    } else {
      currentSegment.maneuver = 'straight'
    }

    if (currentSegment?.instruction?.currentStreet || currentSegment?.instruction?.nextStreet) {
      if (!this.isShowFullPanelData$.value) this.navigatorPanelData$.next(currentSegment)
    }

    if (currentSegment?.distance <= 30) {
      if (this.prevSegmentMinIndex !== minIndex) {
        this.prevSegmentMinIndex = minIndex
        await this.rotateNavigatorCamera(coords, segments[minIndex + 1]?.instruction?.endLocation)
      }
    }
  }

  private async paintOverRoute(riderCoords: Coords): Promise<void> {
    const distance: number = 20
    let isNext: boolean = true

    if (this.currentRoute && isNext) {
      const distanceToPoint = this.mapSvc.getDistanceFromLatLonInKm(
        riderCoords.lat, riderCoords.lng,
        this.currentRoute.features[0].geometry.coordinates[0][1], this.currentRoute.features[0].geometry.coordinates[0][0]
      ) * 1000
      if (distanceToPoint <= distance) {
        isNext = false
        this.coveredPoints.push([
          this.currentRoute.features[0].geometry.coordinates[0][0],
          this.currentRoute.features[0].geometry.coordinates[0][1]
        ])
        const routeForPolyline = this.utilsSvc.cloneDeep(this.currentRoute)

        routeForPolyline.features[0].geometry.coordinates = [...this.coveredPoints]
        if (this.prevPolylineId) this.mapSvc.removePolyline(this.prevPolylineId)
        if (this.coveredPoints.length >= 2) {
          this.prevPolylineId = await this.mapSvc.addPolyline(routeForPolyline, 'covered', 'rgba(152, 215, 172, 1)', 11)
        }
        this.currentRoute.features[0].geometry.coordinates.shift()
        const timeout = setTimeout(() => {
          isNext = true
          clearTimeout(timeout)
        }, 100)
      }
    }
  }

  public clearPaintOverRouteCash(): void {
    this.currentRoute = null
    this.prevPolylineId = null
    this.coveredPoints = []
  }

  private checkDistanceToPointFinish(startCoords: Coords): void {
    const distanceToPoint = 20
    const distanceToTypePoint = this.mapSvc.getDistanceFromLatLonInKm(
      startCoords.lat, startCoords.lng,
      <number>this.routeEndCoords?.lat, <number>this.routeEndCoords?.lng
    ) * 1000
    if (distanceToTypePoint < distanceToPoint) {
      this.isShowFullPanelData$.next(true)
      const panelData: Segment = {...this.navigatorPanelData$.value}
      panelData.maneuver = null
      panelData.instruction.nextStreet = null
      this.navigatorPanelData$.next(panelData)
    }
  }

}
