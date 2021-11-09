import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core'
import {FormGroup} from '@angular/forms'
import {Keyboard} from '@ionic-native/keyboard/ngx'
import {Subject} from 'rxjs'
import {takeUntil} from 'rxjs/operators'

import {
  FormControlsService,
  MapService,
  ModalsService,
  NavigatorService,
  StorageService,
  TransportService,
  UtilsService
} from '@app/shared/services'
import {
  AddressType,
  CompleteMethodEvent,
  ControlItem,
  RouteLog,
  SearchResultItem,
  TransportItem
} from '@app/shared/models'
import {ROUTE_LOG} from '@app/shared/constants'

@Component({
  selector: 'app-route-options-modal',
  templateUrl: './route-options-modal.component.html',
  styleUrls: ['./route-options-modal.component.scss']
})
export class RouteOptionsModalComponent implements OnInit, AfterViewInit, OnDestroy {

  public form: FormGroup | null = null
  public startFieldResults: SearchResultItem[] = []
  public endFieldResults: SearchResultItem[] = []
  public transports: TransportItem[] = []
  public disabledAutocomplete: boolean = false
  public myPositionIsSelected = {
    startField: false,
    endField: false
  }

  private submitted: boolean = false
  private selectedStartAddress: SearchResultItem | null = null
  private selectedEndAddress: SearchResultItem | null = null
  private selectedTrasnport: TransportItem | null = null
  private destroy$: Subject<boolean> = new Subject<boolean>()

  constructor(
    public modalsSvc: ModalsService,
    private formControlsSvc: FormControlsService,
    private mapSvc: MapService,
    private transportSvc: TransportService,
    private utilsSvc: UtilsService,
    private navigatorSvc: NavigatorService,
    private storageSvc: StorageService,
    private keyboard: Keyboard
  ) {
  }

  ngOnInit() {
    this.buildForm()
    this.transports = this.transportSvc.transports
    this.startFieldResults = this.updateResultValues([])
    this.endFieldResults = this.updateResultValues([])
  }

  ngAfterViewInit() {
    this.keyboardBehavior()
  }

  ngOnDestroy() {
    this.destroy$.next(true)
  }

  public get formInvalid(): boolean {
    return this.form?.invalid || this.submitted
  }

  public get completeOnFocusStart(): boolean {
    return (
      this.startFieldResults?.length > 1
      || this.startFieldResults?.length === 1 && !this.myPositionIsSelected?.startField && !this.myPositionIsSelected?.endField
    )
  }

  public get completeOnFocusEnd(): boolean {
    return (
      this.endFieldResults?.length > 1
      || this.endFieldResults?.length === 1 && !this.myPositionIsSelected?.startField && !this.myPositionIsSelected?.endField
    )
  }

  private buildForm(): void {
    const startControl: ControlItem = this.formControlsSvc.getStartControl({required: true})
    const endControl: ControlItem = this.formControlsSvc.getEndControl({required: true})

    this.form = new FormGroup({
      start: startControl.control,
      end: endControl.control,
      transport: this.formControlsSvc.getTransportControl({required: true}).control
    })

    this.form.controls.start.setValidators([
      ...startControl.validators,
      () => {
        if (this.selectedStartAddress) return null
        return {invalidAddress: true}
      }
    ])

    this.form.controls.end.setValidators([
      ...endControl.validators,
      () => {
        if (this.selectedEndAddress) return null
        return {invalidAddress: true}
      }
    ])
  }

  public async submit(): Promise<void> {
    try {
      if (
        !this.selectedStartAddress?.item?.position?.lat ||
        !this.selectedStartAddress?.item?.position?.lng ||
        !this.selectedEndAddress?.item?.position?.lat ||
        !this.selectedEndAddress?.item?.position?.lng ||
        !this.selectedTrasnport
      ) return

      if (this.formInvalid) return
      this.submitted = true

      const routeLog: RouteLog = {
        startCoords: {
          lat: this.selectedStartAddress?.item.position.lat,
          lng: this.selectedStartAddress?.item.position.lng
        },
        endCoords: {
          lat: this.selectedEndAddress?.item.position.lat,
          lng: this.selectedEndAddress?.item.position.lng
        },
        transport: this.selectedTrasnport
      }

      this.navigatorSvc.initNavigator(routeLog.startCoords, routeLog.endCoords, routeLog.transport)

      this.storageSvc.set(ROUTE_LOG, routeLog)
      this.modalsSvc.isShowRouteOptionsModal = false
    } catch (e) {
      console.error(e)
    } finally {
      this.submitted = false
    }
  }

  public swap(): void {
    if (!this.form || !this.form?.controls?.start || !this.form?.controls?.end) return
    if (!this.selectedStartAddress && !this.selectedEndAddress) return

    const startFieldResults = this.utilsSvc.cloneDeep(this.startFieldResults)
    this.startFieldResults = this.updateResultValues(this.utilsSvc.cloneDeep(this.endFieldResults))
    this.endFieldResults = this.updateResultValues(startFieldResults)

    const startFieldValue = this.utilsSvc.cloneDeep(this.form.controls.start.value)
    const endFieldValue = this.utilsSvc.cloneDeep(this.form.controls.end.value)
    this.form.controls.start.patchValue(endFieldValue)
    this.form.controls.end.patchValue(startFieldValue)

    const selectedStartAddress = this.utilsSvc.cloneDeep(this.selectedStartAddress)
    this.selectedStartAddress = this.utilsSvc.cloneDeep(this.selectedEndAddress)
    this.selectedEndAddress = selectedStartAddress

    this.updateControls()
  }

  public async searchAddress(event: CompleteMethodEvent, type: AddressType): Promise<void> {
    if (type === 'start') {
      if (event?.originalEvent?.type === 'input') {
        this.selectedStartAddress = null
      }

      this.updateControls()

      if (event?.query) {
        let startResults: SearchResultItem[]

        if (event?.originalEvent?.type === 'input') {
          startResults = this.updateResultValues(await this.mapSvc.searchStreetItems(event.query))
          this.myPositionIsSelected.startField = false
        } else {
          const prevStartResult = this.utilsSvc.cloneDeep(this.startFieldResults)
          prevStartResult.shift()
          startResults = this.updateResultValues(prevStartResult)
        }

        this.startFieldResults = this.updateResultValues(this.filterResults(startResults))
        this.myPositionIsSelected.startField = false
        return
      }

      this.startFieldResults = this.updateResultValues([])
    } else if (type === 'end') {
      if (event?.originalEvent?.type === 'input') {
        this.selectedEndAddress = null
      }

      this.updateControls()

      if (event?.query) {
        let endResults: SearchResultItem[]

        if (event?.originalEvent?.type === 'input') {
          endResults = this.updateResultValues(await this.mapSvc.searchStreetItems(event.query))
          this.myPositionIsSelected.endField = false
        } else {
          const prevEndResults = this.utilsSvc.cloneDeep(this.endFieldResults)
          prevEndResults.shift()
          endResults = this.updateResultValues(prevEndResults)
        }

        this.endFieldResults = this.updateResultValues(this.filterResults(endResults))
        return
      }

      this.endFieldResults = this.updateResultValues([])
      this.myPositionIsSelected.endField = false
    }
  }

  public selectAddress(item: SearchResultItem, type: AddressType): void {
    if (!item || !type) return

    if (type === 'start') {
      this.selectedStartAddress = item
      this.startFieldResults = this.updateResultValues([])
      this.myPositionIsSelected.startField = false
    } else if (type === 'end') {
      this.selectedEndAddress = item
      this.endFieldResults = this.updateResultValues([])
      this.myPositionIsSelected.endField = false
    }

    this.updateControls()
  }

  public searchTransport(event: CompleteMethodEvent): void {
    if (event?.query) {
      this.transports = this.transportSvc.transports.filter(el => el?.name?.toLowerCase()?.includes(event.query.toLowerCase()))
      return
    }

    this.transports = this.transportSvc.transports
  }

  public selectTransport(item: TransportItem): void {
    if (item) this.selectedTrasnport = item
  }

  private updateControls(): void {
    if (this.form?.controls?.start) this.form.controls.start.updateValueAndValidity()
    if (this.form?.controls?.end) this.form.controls.end.updateValueAndValidity()
  }

  public async selectCurrentPosition(type: AddressType): Promise<void> {
    try {
      this.disabledAutocomplete = true

      const getSearchItem = async () => {
        const myPosition: GeolocationPosition = await this.mapSvc.getMyPosition()
        const myCoords = this.mapSvc.getCoordsFromPosition(myPosition)

        return this.mapSvc.reverseGeocode(myCoords)
      }

      if (type === 'start') {
        const result = await getSearchItem()
        this.selectedStartAddress = result
        if (this.form) this.form.controls.start.patchValue(result)
        this.myPositionIsSelected.startField = true
      } else if (type === 'end') {
        const result = await getSearchItem()
        this.selectedEndAddress = result
        if (this.form) this.form.controls.end.patchValue(result)
        this.myPositionIsSelected.endField = true
      }

      this.updateControls()
    } catch (e) {
      console.error(e)
    } finally {
      setTimeout(() => {
        this.disabledAutocomplete = false
      }, 500)
    }
  }

  private updateResultValues(result: SearchResultItem[]): SearchResultItem[] {
    return [<SearchResultItem>{}, ...result]
  }

  private filterResults(items: SearchResultItem[]): SearchResultItem[] {
    if (!(items instanceof Array)) return items
    return items.filter(el => el?.item?.type?.toLowerCase()?.includes('address'))
  }

  private keyboardBehavior(): void {
    if (!this.utilsSvc.isSmartphone()) return

    setTimeout(() => {
      const dialog: HTMLElement | null = document.querySelector('p-dialog')
      const childElem: HTMLElement | null = <HTMLElement>dialog?.firstChild

      if (childElem) {
        this.keyboard.onKeyboardDidShow()
          .pipe(takeUntil(this.destroy$))
          .subscribe(res => {
            const height = res?.keyboardHeight || 0
            childElem.style.paddingBottom = height + 'px'
          }, () => {
            childElem.style.paddingBottom = '0px'
          })

        this.keyboard.onKeyboardHide()
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            childElem.style.paddingBottom = '0px'
          }, () => {
            childElem.style.paddingBottom = '0px'
          })
      }
    }, 100)
  }

}
