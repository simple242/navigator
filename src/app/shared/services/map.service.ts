import {Injectable} from '@angular/core'
import {AnimationOptions, map, Map, MapOptions, Marker, NavigationControl} from '@tomtom-international/web-sdk-maps'
import * as ttServices from '@tomtom-international/web-sdk-services'
import {Address, GenericServiceResponse, GeocodeOptions, TravelMode} from '@tomtom-international/web-sdk-services'
import {GeolocationService} from '@ng-web-apis/geolocation'
import {BehaviorSubject, Observable, Subscription} from 'rxjs'
import {debounceTime, take} from 'rxjs/operators'
import bearing from '@turf/bearing'
import {point} from '@turf/helpers'
import {Geolocation, GeolocationOptions} from '@ionic-native/geolocation/ngx'

import {environment} from '@src/environments/environment'
import {
  AdditionalMapOption,
  Callback,
  Coords, Instruction,
  MapEventKey,
  MapEventParams,
  MapIcon,
  MapMarker,
  MarkerCreateParameters,
  SearchResultItem,
  Segment,
  ttGeoJson,
  Lang
} from '@app/shared/models'
import {LocalizeService} from '@app/shared/services/localize.service'
import {AlertService} from '@app/shared/services/alert.service'
import {UtilsService} from '@app/shared/services/utils.service'

@Injectable()
export class MapService {

  public isSetCenter$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true)

  private readonly geocodeOptions = <const>{
    key: environment.map.key,
    language: 'en-GB',
    limit: 10
  }

  private waitMapDefination$: BehaviorSubject<boolean | null> = new BehaviorSubject<boolean | null>(null)
  private ttMap: Map | null = null
  private readonly mapKey: string = environment.map.key
  private readonly mapCounter: {[key: string]: number} = {}
  private markers: {[key: string]: MapMarker} = {}
  private currentUserMarkerId: string = ''
  private mapEvents: MapEventParams[] = []
  private polylines: string[] = []

  constructor(
    private readonly geolocation$: GeolocationService,
    private localizeSvc: LocalizeService,
    private alertSvc: AlertService,
    private utilsSvc: UtilsService,
    private geolocation: Geolocation
  ) {
  }

  public get map(): Map | null {
    return this.ttMap
  }

  public get mapImages() {
    // ID MUST BE UNIQUE

    return <const>{
      defaultPosition: {
        src: 'assets/icons/map/default-position.png',
        id: 'defaultPosition'
      },
      start: {
        src: 'assets/icons/map/start.png',
        id: 'startIcon'
      },
      end: {
        src: 'assets/icons/map/end.png',
        id: 'endIcon'
      }
    }
  }

  public get userMarkerId(): string {
    return this.currentUserMarkerId
  }

  public initMap(container: HTMLElement, config?: AdditionalMapOption): void {
    try {
      this.mapRequestCounter('INIT_MAP')

      const mapConfig: MapOptions = {
        zoom: 15,
        stylesVisibility: {
          map: true,
          poi: true,
          trafficFlow: false,
          trafficIncidents: true
        },
        ...config,
        key: this.mapKey,
        container
      }

      this.ttMap = map(mapConfig)
      // this.addDefaultControl()
      this.waitMapDefination$.next(true)
    } catch (e) {
      console.error(e)
      this.waitMapDefination$.next(false)
    }
  }

  public destroyMap(): void {
    this.removeAllPolylines()
    this.removeAllMarkers()
    this.removeAllMapEvents()
    this.markers = {}
    this.polylines = []
    this.mapEvents = []
    this.ttMap = null
  }

  public async waitMapDefinition(): Promise<void> {
    const MAX_WAIT_TIME: number = 5_000
    let sub: Subscription | null = null

    try {
      await new Promise((resolve, reject) => {
        sub = this.waitMapDefination$.subscribe(res => {
          if (res === true || res === false) {
            resolve(true)
          }
        }, reject)

        setTimeout(() => {
          resolve(true)
        }, MAX_WAIT_TIME)
      })
    } catch (e) {
      console.error(e)
    } finally {
      if (sub) (<Subscription>sub)?.unsubscribe()
    }
  }

  private checkavAilabilityMap(): boolean {
    if (this.ttMap) return true

    console.error('Map not found!')
    return false
  }

  private addDefaultControl(): void {
    const navCtrl: NavigationControl = new NavigationControl({
      showCompass: true,
      showPitch: true,
      showExtendedPitchControls: true,
      showExtendedRotationControls: true,
      showZoom: true
    })

    if (!this.checkavAilabilityMap()) return

    this.ttMap!.addControl(navCtrl, 'bottom-left')
  }

  public createMarker(coords: Coords, id: string, icon: MapIcon): MapMarker | null {
    try {
      if (this.markers[id]) {
        this.changeMarkerLocation(id, coords)
        return this.markers[id]
      }

      const params: MarkerCreateParameters = {
        id,
        cssClass: icon.cssClass,
        center: coords,
        imageUrl: icon.imageUrl
      }

      const markerBody = document.createElement('div')
      markerBody.id = params.id
      markerBody.className = 'map__marker ' + (params.cssClass || '')

      if (params.imageUrl) {
        markerBody.style.setProperty('background-image', `url('${params.imageUrl}')`)
      }

      const marker = new Marker({element: markerBody})

      if (params.center) {
        marker.setLngLat(params.center)
      }

      this.markers[id] = {
        marker,
        wasAdded: false,
        id
      }

      return this.markers[id]
    } catch (e) {
      console.error(e)
      return null
    }
  }

  public changeMarkerLocation(markerId: string, coords: Coords): void {
    try {
      if (!markerId) {
        console.error(`Marker "${markerId}" not found!`)
        return
      }

      if (!coords) {
        console.error('Coords not found!')
        return
      }

      const mapMarker: MapMarker = this.markers[markerId]

      if (!mapMarker?.marker) {
        console.error(`Marker "${markerId}" not found!`)
        return
      }

      if (!mapMarker?.wasAdded) {
        console.error(`The marker "${markerId}" has not been added to the map!`)
        return
      }

      mapMarker.marker.setLngLat(coords)
    } catch (e) {
      console.error(e)
    }
  }

  public addMarkerToMap(mapMarker: MapMarker): boolean {
    try {
      if (!mapMarker?.id) {
        console.error('Marker id not found!')
        return false
      }

      if (!mapMarker?.marker) {
        console.error(`Marker "${mapMarker.id}" not found!`)
        return false
      }

      if (mapMarker?.wasAdded) {
        console.error(`The marker "${mapMarker.id}" has already been added to the map!`)
        return false
      }

      if (!this.checkavAilabilityMap()) return false

      mapMarker.marker.addTo(this.ttMap!)

      this.markers[mapMarker.id].wasAdded = true
      mapMarker.wasAdded = true
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  public addUserMarkerToMap(mapMarker: MapMarker): boolean {
    if (this.addMarkerToMap(mapMarker)) {

      if (this.currentUserMarkerId) {
        this.removeMarkerFromMap(this.currentUserMarkerId)
      }

      this.currentUserMarkerId = mapMarker.id
      return true
    }

    return false
  }

  public async addDefaultUserMarkerToMap(coords?: Coords): Promise<void> {
    try {
      let currentCoords: Coords = <Coords>coords

      if (!currentCoords) {
        const myPosition: GeolocationPosition = await this.getMyPosition()
        currentCoords = this.getCoordsFromPosition(myPosition)
      }

      const marker = this.createMarker(
        currentCoords,
        this.mapImages.defaultPosition.id,
        {imageUrl: this.mapImages.defaultPosition.src}
      )

      if (marker) this.addUserMarkerToMap(marker)
    } catch (e) {
      console.error(e)
    }
  }

  public removeMarkerFromMap(markerId: string): void {
    try {
      const mapMarker: MapMarker = this.markers[markerId]

      if (mapMarker) {
        mapMarker.marker.remove()
      }

      delete (this.markers[markerId])
    } catch (e) {
      console.error(e)
    }
  }

  public removeAllMarkers() {
    Object.keys(this.markers).forEach(el => {
      if (el) this.removeMarkerFromMap(el)
    })
    this.markers = {}
  }

  public async getMyPosition(): Promise<GeolocationPosition> {
    try {
      if (!this.utilsSvc.isSmartphone()) {
        return await new Promise((resolve, reject) => {
          this.geolocation$
            .pipe(take(1))
            .subscribe(resolve, reject)
        })
      } else {
        const options: GeolocationOptions = {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 1000
        }

        return await this.geolocation.getCurrentPosition(options)
      }
    } catch (e) {
      console.error(e)
      this.alertSvc.warningDialog(
        this.localizeSvc.translate('ERRORS.GEOLOCATION.TITLE'),
        this.localizeSvc.translate('ERRORS.GEOLOCATION.TEXT'),
        'error', 10_000
      )
      return <GeolocationPosition>{}
    }
  }

  public observeMyGeolocation(debounce: number): Observable<GeolocationPosition> {
    if (!this.utilsSvc.isSmartphone()) {
      return this.geolocation$.pipe(debounceTime(debounce))
    } else {
      const options: GeolocationOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
      }

      return <Observable<GeolocationPosition>>this.geolocation.watchPosition(options).pipe(debounceTime(debounce))
    }
  }

  public getCoordsFromPosition(position: GeolocationPosition): Coords {
    return {
      lng: position.coords.longitude,
      lat: position.coords.latitude
    }
  }

  public updateMapCenter(position: Coords): void {
    const options: AnimationOptions = {
      duration: 500
    }

    if (!this.checkavAilabilityMap()) return

    this.ttMap!.panTo(position, options)
  }

  public addMapEvent(name: MapEventKey, listener: Callback): void {
    if (!this.checkavAilabilityMap()) return

    this.ttMap!.on(name, listener)

    this.mapEvents.push({name, listener})
  }

  public removeAllMapEvents(): void {
    if (!this.checkavAilabilityMap()) return

    this.mapEvents.forEach(e => {
      this.ttMap!.off(e.name, e.listener)
    })
    this.mapEvents = []
  }

  public async searchStreetItems(text: string): Promise<SearchResultItem[]> {
    const items: SearchResultItem[] = []
    const searchResult: GenericServiceResponse = await this.searchGeocode(text)

    if (!searchResult?.results) {
      return items
    }

    searchResult.results.forEach((item: any) => {
      if (item.address) {
        const fullAddress = this.genAddressByData(item.address)
        const city = this.getCity(item.address)

        if (!items.find(el => el.fullAddress === fullAddress)) {
          items.push({
            fullAddress,
            item,
            city
          })
        }
      }
    })

    return items
  }

  private searchGeocode(text: string): Promise<GenericServiceResponse> {
    const options: GeocodeOptions = {
      ...this.geocodeOptions,
      language: this.getMapLang(this.localizeSvc.currentLang)
    }

    return this.geocode(text, options)
  }

  public async reverseGeocode(coords: Coords): Promise<SearchResultItem | null> {
    try {
      this.mapRequestCounter('REVERSE GEOCODE')

      const geocodeResult = await ttServices.services.reverseGeocode({
        ...this.geocodeOptions,
        position: coords
      })

      return {
        item: geocodeResult.addresses[0],
        city: this.getCity(geocodeResult.addresses[0].address),
        fullAddress: this.genAddressByData(geocodeResult.addresses[0].address)
      }
    } catch (e) {
      console.error(e)
      return null
    }
  }

  private geocode(text: string, options: GeocodeOptions): Promise<GenericServiceResponse> {
    this.mapRequestCounter('GEOCODE')

    const combinedOptions: GeocodeOptions = options
    combinedOptions.query = text
    return ttServices.services.geocode(combinedOptions)
  }

  private getCity(searchResult: Address): string {
    return searchResult?.municipality || searchResult?.municipalitySubdivision || searchResult?.countrySecondarySubdivision || ''
  }

  private genAddressByData(searchResult: Address): string {
    const base: string[] = []

    if (searchResult?.streetName) {
      base.push(searchResult.streetName)
    }

    if (searchResult?.streetNumber) {
      base.push(searchResult.streetNumber)
    }

    const city: string = this.getCity(searchResult)

    if (city) {
      base.push(city)
    }

    if (searchResult?.country) {
      base.push(searchResult.country)
    }

    return base.join(', ')
  }

  private getMapLang(lang: Lang | null): string {
    if (!lang) return 'en-GB'

    switch (lang) {
      case 'ru':
        return 'ru-RU'
      case 'en':
        return 'en-GB'
      case 'uk':
        return 'uk-UA'
      default:
        return 'en-GB'
    }
  }

  public async calculateRoute(travelMode: TravelMode, ...coords: Coords[]): Promise<ttGeoJson | null> {
    try {
      let locations: string = ''
      coords.forEach(el => {
        if (el?.lat && el?.lng) {
          locations += `${el.lng},${el.lat}:`
        }
      })
      locations = locations.slice(0, -1)

      const options: any = {
        key: environment.map.key,
        locations,
        instructionsType: 'text',
        travelMode
      }

      this.mapRequestCounter('CALCULATE_ROUTE')
      const response = await ttServices.services.calculateRoute(options)

      return response.toGeoJson()
    } catch (e) {
      console.error(e)
      return null
    }
  }

  public async addPolyline(geojson: ttGeoJson, id: string, lineColor?: string, lineWidth?: number): Promise<string | null> {
    try {
      if (!this.checkavAilabilityMap()) return null

      id += Date.now()
      const color = lineColor || '#559dd6'
      const width = lineWidth || 10

      this.ttMap!.addLayer({
        id,
        type: 'line',
        source: {
          type: 'geojson',
          data: geojson
        },
        paint: {
          'line-color': color,
          'line-width': width
        }
      })

      this.polylines.push(id)
      return id
    } catch (e) {
      console.error(e)
      return null
    }
  }

  public removeAllPolylines(): void {
    if (!this.checkavAilabilityMap()) return

    this.polylines.forEach(el => {
      this.ttMap!.removeLayer(el)
    })
    this.polylines = []
  }

  public removePolyline(id: string): void {
    if (!this.checkavAilabilityMap()) return

    this.polylines.forEach(el => {
      if (el?.startsWith(id)) {
        this.ttMap!.removeLayer(id)
      }
    })

    this.polylines = this.polylines.filter(el => !el.startsWith(id))
  }

  public setPitch(val?: number): void {
    if (!this.checkavAilabilityMap()) return

    const deg = val || 60
    this.ttMap!.setPitch(deg)
  }

  public setZoom(val?: number): void {
    if (!this.checkavAilabilityMap()) return

    const zoom = val || 18
    this.ttMap!.setZoom(zoom)
  }

  public calculateBearing(startCoords: Coords, endCoords: Coords) {
    try {
      const point1 = point([startCoords.lat, startCoords.lng])
      const point2 = point([endCoords.lat, endCoords.lng])
      return bearing(point1, point2)
    } catch (e) {
      console.error(e)
      return 0
    }
  }

  public async rotateCamera(deg?: number) {
    if (!this.checkavAilabilityMap()) return

    const time = 1000

    const bearingDeg = deg || 45
    const options: tt.AnimationOptions = {
      animate: true,
      duration: time
    }

    this.ttMap!.rotateTo(bearingDeg, options)

    return await new Promise(resolve => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout)
        resolve(true)
      }, time)
    })
  }

  public calculateTriangleGeolocation(instructions: Instruction[], riderCoords: Coords): Segment[] {
    const segments: Segment[] = []

    instructions.forEach(el => {
      const triangle = {
        a: this.getDistanceFromLatLonInKm(
          riderCoords.lat,
          riderCoords.lng,
          el.startLocation.lat,
          el.startLocation.lng
        ),
        b: this.getDistanceFromLatLonInKm(
          el.startLocation.lat,
          el.startLocation.lng,
          el.endLocation.lat,
          el.endLocation.lng
        ),
        c: this.getDistanceFromLatLonInKm(
          el.endLocation.lat,
          el.endLocation.lng,
          riderCoords.lat,
          riderCoords.lng
        )
      }

      const p = (triangle.a + triangle.b + triangle.c) / 2
      const h = (2 / triangle.b) * Math.sqrt(
        p * (p - triangle.a) * (p - triangle.b) * (p - triangle.c)
      )

      if (!isNaN(h)) {
        segments.push({
          h,
          instruction: el
        })
      }
    })

    return segments
  }

  public getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  private mapRequestCounter(key: string): void {
    if (!key) return

    this.mapCounter[key] = this.mapCounter[key] ? this.mapCounter[key] + 1 : 1

    console.log(`%c===== ${key} ===== ${this.mapCounter[key]}`, 'background: #222; color: #bada55')
  }

}
